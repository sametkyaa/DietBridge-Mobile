#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
    copyFileSync,
    existsSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { createClient } from '@supabase/supabase-js';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(process.env.DIETBRIDGE_WEB_REPO || join(mobileRoot, '..', 'DietBridge-Web-MVP4'));
const migrationDirectory = join(webRoot, 'supabase', 'migrations');
const notificationCoreMigration = '20260814214101_notification_core_backend.sql';
const appointmentReminderMigration = '20260816194431_appointment_reminders_backend.sql';
const pushMigration = '20260817120000_push_registry_outbox_backend.sql';
const cliVersion = '2.110.0';
const projectId = `dietbridge-push-client-${process.pid}-${randomUUID().slice(0, 8)}`;
const projectUuid = randomUUID();
const password = 'Disposable-Push-Client-6c1!';
const npxCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');

const actorIds = [];
let disposable;
let local;
let admin;
let stackStarted = false;
let mainError;

const pass = (label, detail = '') => process.stdout.write(`PASS: ${label}${detail ? ` ${detail}` : ''}\n`);
const assert = (condition, label, detail = '') => {
    if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ''}`);
    pass(label, detail);
};

const redact = (value) => String(value)
    .replace(/\b(sb_(?:secret|publishable)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)\b/g, '[redacted]')
    .replace(/\b[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*\S+/g, '[redacted]');

const cleanEnvironment = (environment) => Object.fromEntries(
    Object.entries(environment).filter(([key]) => !(
        /^(?:SUPABASE|VITE_SUPABASE|EXPO_PUBLIC_SUPABASE|DATABASE_URL$|POSTGRES_|PGHOST$|PGPORT$|PGDATABASE$|PGUSER$|PGPASSWORD$|PGSERVICE$)/.test(key)
    )),
);

const runCli = (tempRoot, args) => {
    try {
        return execFileSync(
            process.execPath,
            [npxCli, '--yes', `supabase@${cliVersion}`, '--workdir', tempRoot, ...args],
            {
                cwd: mobileRoot,
                encoding: 'utf8',
                env: { ...cleanEnvironment(process.env), TZ: 'Europe/Istanbul' },
                maxBuffer: 32 * 1024 * 1024,
                timeout: 15 * 60 * 1000,
            },
        );
    } catch (error) {
        throw new Error(`Supabase ${args.join(' ')} failed: ${redact(error.message)}\n${redact(String(error.stdout || '').slice(-6000))}\n${redact(String(error.stderr || '').slice(-6000))}`);
    }
};

const isPortFree = (port) => new Promise((resolvePromise) => {
    const server = createServer();
    server.once('error', () => resolvePromise(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolvePromise(true)));
});

const choosePortBase = async () => {
    const occupied = new Set(Array.from(
        execFileSync('docker', ['ps', '--format', '{{.Ports}}'], { encoding: 'utf8', timeout: 30_000 })
            .matchAll(/(?:0\.0\.0\.0:|\[::\]:)(\d+)->/g),
        (match) => Number(match[1]),
    ));
    const first = 59000 + (process.pid % 500);
    for (let offset = 0; offset < 4000; offset += 20) {
        const base = first + offset;
        const ports = [base, base + 1, base + 2, base + 3, base + 4, base + 7, base + 9, base + 83];
        if (ports.some((port) => occupied.has(port))) continue;
        if ((await Promise.all(ports.map(isPortFree))).every(Boolean)) return base;
    }
    throw new Error('No disposable loopback port range is available.');
};

const configureProject = async (configPath) => {
    const base = await choosePortBase();
    const config = readFileSync(configPath, 'utf8')
        .replace(/^project_id\s*=\s*"[^"]+"$/m, `project_id = "${projectId}"`)
        .replace(/^port\s*=\s*54321$/m, `port = ${base}`)
        .replace(/^port\s*=\s*54322$/m, `port = ${base + 1}`)
        .replace(/^shadow_port\s*=\s*54320$/m, `shadow_port = ${base + 2}`)
        .replace(/^port\s*=\s*54329$/m, `port = ${base + 9}`)
        .replace(/^port\s*=\s*54323$/m, `port = ${base + 3}`)
        .replace(/^port\s*=\s*54324$/m, `port = ${base + 4}`)
        .replace(/^port\s*=\s*54327$/m, `port = ${base + 7}`)
        .replace(/^inspector_port\s*=\s*8083$/m, `inspector_port = ${base + 83}`);
    writeFileSync(configPath, config, 'utf8');
};

const parseStatus = (value) => Object.fromEntries(
    value.split(/\r?\n/)
        .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
        .filter(Boolean)
        .map((match) => [match[1], match[2]]),
);

const sqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;

const readSql = (sql) => execFileSync('docker', [
    'exec', `supabase_db_${projectId}`, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', sql,
], { encoding: 'utf8', timeout: 30_000 }).trim();

const countSql = (sql) => Number(readSql(sql));

const assertNoError = (result, label) => {
    if (!result || result.error) throw new Error(`${label}: ${redact(result?.error?.message || 'missing result')}`);
    return result.data;
};

const createActor = async (label) => {
    const result = await admin.auth.admin.createUser({
        email: `push-6c1-${label}-${randomUUID()}@example.invalid`,
        password,
        email_confirm: true,
        user_metadata: { account_type: 'client', role: 'client', full_name: `Disposable Push ${label}` },
    });
    const user = assertNoError(result, `${label} Auth fixture`);
    assert(Boolean(user?.user?.id), `${label.toUpperCase()}_AUTH_CREATED`);
    actorIds.push(user.user.id);
    return { id: user.user.id, email: user.user.email };
};

const createActorClient = async (actor) => {
    const anonymous = createClient(local.API_URL, local.ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const result = await anonymous.auth.signInWithPassword({ email: actor.email, password });
    const session = assertNoError(result, 'actor sign-in');
    return createClient(local.API_URL, local.ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
};

const registerWithMobileRpcContract = async (client, installationId, token, label) => {
    const { data: { user } = {}, error: authError } = await client.auth.getUser();
    assert(!authError && Boolean(user?.id), `${label}_AUTHENTICATED`);
    const result = await client.rpc('register_push_installation', {
        p_installation_id: installationId,
        p_expo_push_token: token,
        p_platform: 'android',
        p_project_id: projectUuid,
        p_app_version: '6c1-test',
        p_native_build_version: '6c1-build',
    });
    const rows = assertNoError(result, label);
    assert(Array.isArray(rows) && rows.length === 1, `${label}_ONE_SAFE_ROW`);
    assert(!Object.prototype.hasOwnProperty.call(rows[0], 'expo_push_token'), `${label}_TOKEN_NOT_RETURNED`);
    return rows[0];
};

const revokeWithMobileRpcContract = async (client, installationId, label) => {
    const result = await client.rpc('revoke_push_installation', { p_installation_id: installationId });
    assertNoError(result, label);
    pass(`${label}_NO_TOKEN_REQUIRED`);
};

const cleanupFixtures = async () => {
    if (!admin) return;
    for (const actorId of [...actorIds].reverse()) {
        assertNoError(await admin.auth.admin.deleteUser(actorId), 'Auth cleanup');
    }
    assert(countSql('select count(*) from private.push_installations;') === 0, 'RESIDUE_PUSH_INSTALLATIONS_ZERO');
    assert(countSql('select count(*) from private.push_occurrences;') === 0, 'RESIDUE_PUSH_OCCURRENCES_ZERO');
    assert(countSql('select count(*) from private.push_deliveries;') === 0, 'RESIDUE_PUSH_DELIVERIES_ZERO');
    assert(countSql('select count(*) from auth.users;') === 0, 'RESIDUE_AUTH_ZERO');
    pass('DISPOSABLE_DATABASE_RESIDUE_ZERO');
};

const run = async () => {
    const webModule = await import(pathToFileURL(join(webRoot, 'scripts', 'materializeDisposableSupabaseReplay.mjs')).href);
    const replayModule = await import(pathToFileURL(join(webRoot, 'scripts', 'runDisposableSupabaseLocalReplay.mjs')).href);
    const sourceMigrations = readdirSync(migrationDirectory).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
    assert(sourceMigrations.length === 48, 'CANONICAL_WEB_MIGRATION_INVENTORY_48');
    assert(sourceMigrations.at(-1) === pushMigration, 'CANONICAL_PUSH_MIGRATION_TAIL');

    const tempParent = mkdtempSync(join(tmpdir(), 'dietbridge-push-client-'));
    const tempRoot = join(tempParent, 'project');
    const runtimeManifest = webModule.materializeDisposableReplay({ repoRoot: webRoot, outputRoot: tempRoot });
    const configPath = join(tempRoot, 'supabase', 'config.toml');
    copyFileSync(join(webRoot, 'supabase', 'config.toml'), configPath, 1);
    disposable = { tempParent, tempRoot };
    for (const migrationName of [notificationCoreMigration, appointmentReminderMigration, pushMigration]) {
        copyFileSync(join(migrationDirectory, migrationName), join(tempRoot, 'supabase', 'migrations', migrationName), 1);
    }
    writeFileSync(join(tempRoot, 'supabase', 'migrations', replayModule.LOCAL_PREREQUISITE_FILE), replayModule.LOCAL_PREREQUISITE_SQL, { flag: 'wx' });
    assert(runtimeManifest.expectedHistory.total === 45, 'DISPOSABLE_BASELINE_MATERIALIZED_45');
    assert(readdirSync(join(tempRoot, 'supabase', 'migrations')).filter((name) => /^\d+_.+\.sql$/.test(name)).length === 49, 'DISPOSABLE_MIGRATION_REPLAY_48_PLUS_PREREQUISITE');
    await configureProject(configPath);

    runCli(tempRoot, ['start']);
    stackStarted = true;
    pass('DISPOSABLE_LOCAL_STACK_STARTED', projectId);
    runCli(tempRoot, ['db', 'reset', '--local', '--no-seed']);
    local = parseStatus(runCli(tempRoot, ['status', '--output', 'env']));
    assert(local.API_URL.startsWith('http://127.0.0.1:'), 'DISPOSABLE_LOOPBACK_ONLY');
    assert(Boolean(local.ANON_KEY && local.SERVICE_ROLE_KEY), 'DISPOSABLE_KEYS_PRESENT');
    admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

    const actorA = await createActor('client-a');
    const actorB = await createActor('client-b');
    const clientA = await createActorClient(actorA);
    const clientB = await createActorClient(actorB);
    const installationId = randomUUID();
    const tokenOne = `ExponentPushToken[phase6c1-one-${randomUUID().slice(0, 8)}]`;
    const tokenTwo = `ExpoPushToken[phase6c1-two-${randomUUID().slice(0, 8)}]`;

    await registerWithMobileRpcContract(clientA, installationId, tokenOne, 'FIRST_REGISTRATION');
    assert(countSql(`select count(*) from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === 1, 'FIRST_REGISTRATION_ACTIVE');
    assert(readSql(`select expo_push_token from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === tokenOne, 'FIRST_REGISTRATION_TOKEN');

    await registerWithMobileRpcContract(clientA, installationId, tokenOne, 'IDEMPOTENT_REREGISTRATION');
    assert(countSql(`select count(*) from private.push_installations where installation_id = ${sqlLiteral(installationId)};`) === 1, 'IDEMPOTENT_ONE_ROW');

    await registerWithMobileRpcContract(clientA, installationId, tokenTwo, 'TOKEN_ROTATION');
    assert(countSql(`select count(*) from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === 1, 'TOKEN_ROTATION_ONE_ACTIVE');
    assert(countSql(`select count(*) from private.push_installations where expo_push_token = ${sqlLiteral(tokenOne)} and enabled;`) === 0, 'TOKEN_ROTATION_OLD_DISABLED');
    assert(readSql(`select expo_push_token from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === tokenTwo, 'TOKEN_ROTATION_CURRENT_TOKEN');

    await registerWithMobileRpcContract(clientB, installationId, tokenTwo, 'ACCOUNT_REBIND');
    assert(countSql(`select count(*) from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === 1, 'ACCOUNT_REBIND_ONE_ACTIVE');
    assert(readSql(`select user_id from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === actorB.id, 'ACCOUNT_REBIND_CURRENT_OWNER');
    assert(countSql(`select count(*) from private.push_installations where installation_id = ${sqlLiteral(installationId)} and user_id = ${sqlLiteral(actorA.id)} and enabled;`) === 0, 'ACCOUNT_REBIND_OLD_OWNER_DISABLED');

    await revokeWithMobileRpcContract(clientB, installationId, 'REVOKE');
    assert(countSql(`select count(*) from private.push_installations where installation_id = ${sqlLiteral(installationId)} and enabled;`) === 0, 'REVOKE_DISABLED');
    await revokeWithMobileRpcContract(clientB, installationId, 'REPEATED_REVOKE');
    pass('NO_EXPO_NETWORK_CALLS');
    pass('PUSH_CLIENT_BACKEND_INTEGRATION_PASS');
};

try {
    await run();
} catch (error) {
    mainError = error;
} finally {
    try {
        await cleanupFixtures();
    } catch (error) {
        mainError = mainError || error;
    }
    if (disposable?.tempRoot && stackStarted) {
        try {
            runCli(disposable.tempRoot, ['stop', '--project-id', projectId, '--no-backup']);
            pass('DISPOSABLE_LOCAL_STACK_STOPPED', projectId);
        } catch (error) {
            mainError = mainError || error;
        }
    }
    if (disposable?.tempParent) {
        try {
            rmSync(disposable.tempParent, { recursive: true, force: true });
            assert(!existsSync(disposable.tempParent), 'DISPOSABLE_TEMP_RESIDUE_ZERO');
        } catch (error) {
            mainError = mainError || error;
        }
    }
    try {
        const containers = execFileSync('docker', ['ps', '-a', '--filter', `name=^supabase_.*_${projectId}$`, '--format', '{{.ID}}'], { encoding: 'utf8', timeout: 30_000 }).trim();
        const volumes = execFileSync('docker', ['volume', 'ls', '--filter', `name=${projectId}`, '--format', '{{.Name}}'], { encoding: 'utf8', timeout: 30_000 }).trim();
        const networks = execFileSync('docker', ['network', 'ls', '--filter', `name=${projectId}`, '--format', '{{.Name}}'], { encoding: 'utf8', timeout: 30_000 }).trim();
        assert(!containers && !volumes && !networks, 'DISPOSABLE_DOCKER_RESIDUE_ZERO');
    } catch (error) {
        mainError = mainError || error;
    }
}

if (mainError) {
    process.stderr.write(`[push-client-disposable] ${redact(mainError.message || mainError)}\n`);
    process.exitCode = 1;
}
