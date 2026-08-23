'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const localDatePath = path.join(__dirname, '..', 'localDate.js');
const source = fs.readFileSync(localDatePath, 'utf8');
const localDateModule = { exports: {} };
const exportedNames = [
    'addLocalDateDays',
    'getLocalWeekDate',
    'getLocalWeekDateKey',
    'getLocalWeekDayIndex',
    'getLocalWeekDayOptions',
    'getLocalWeekStart',
    'toLocalDateKey',
];
const compiledSource = `${source.replaceAll('export const ', 'const ')}\nmodule.exports = { ${exportedNames.join(', ')} };`;

new Function('require', 'module', 'exports', compiledSource)(
    (request) => require(path.resolve(path.dirname(localDatePath), request)),
    localDateModule,
    localDateModule.exports,
);

const {
    getLocalWeekDate,
    getLocalWeekDateKey,
    getLocalWeekDayIndex,
    getLocalWeekDayOptions,
    getLocalWeekStart,
} = localDateModule.exports;

test('Meals date contract resolves Monday, Thursday, and Sunday', () => {
    const monday = new Date('2026-08-10T12:00:00.000Z');
    const thursday = new Date('2026-08-13T12:00:00.000Z');
    const sunday = new Date('2026-08-16T12:00:00.000Z');

    assert.equal(getLocalWeekDayIndex(monday), 0);
    assert.equal(getLocalWeekDayIndex(thursday), 3);
    assert.equal(getLocalWeekDayIndex(sunday), 6);
    assert.equal(getLocalWeekDateKey(3, thursday), '2026-08-13');
    assert.equal(getLocalWeekDateKey(6, sunday), '2026-08-16');
});

test('valid canonical date-key round trip is Monday-first and seven days wide', () => {
    const date = new Date('2026-08-13T12:00:00.000Z');
    const keys = Array.from({ length: 7 }, (_, index) => getLocalWeekDateKey(index, date));

    assert.deepEqual(keys, [
        '2026-08-10',
        '2026-08-11',
        '2026-08-12',
        '2026-08-13',
        '2026-08-14',
        '2026-08-15',
        '2026-08-16',
    ]);
    assert.equal(getLocalWeekDate(3, date).toISOString().slice(0, 10), '2026-08-13');
    assert.equal(getLocalWeekDayOptions(date)[3], 'Per 13');
});

test('week start follows the Istanbul local Sunday-to-Monday boundary', () => {
    assert.equal(
        getLocalWeekStart(new Date('2026-08-16T20:59:59.000Z')).toISOString().slice(0, 10),
        '2026-08-10',
    );
    assert.equal(
        getLocalWeekStart(new Date('2026-08-16T21:00:00.000Z')).toISOString().slice(0, 10),
        '2026-08-17',
    );
});

test('invalid week selections are not mapped to an arbitrary weekday', () => {
    assert.throws(() => getLocalWeekDate(-1), /Geçerli bir hafta günü bulunamadı\./);
    assert.throws(() => getLocalWeekDate(7), /Geçerli bir hafta günü bulunamadı\./);
    assert.throws(() => getLocalWeekDate(undefined), /Geçerli bir hafta günü bulunamadı\./);
});

test('Meals ViewModel and screen use the canonical weekday helper for initialization', () => {
    const viewModelSource = fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'features', 'meals', 'viewmodels', 'useMealsViewModel.js'),
        'utf8',
    );
    const screenSource = fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'features', 'meals', 'screens', 'MealsScreen.js'),
        'utf8',
    );

    assert.match(viewModelSource, /useState\(\(\) => getLocalWeekDayIndex\(\)\)/);
    assert.doesNotMatch(viewModelSource, /new Date\(new Date\(\)\.toLocaleString/);
    assert.match(screenSource, /return getLocalWeekDayIndex\(\);/);
    assert.doesNotMatch(screenSource, /new Date\(new Date\(\)\.toLocaleString/);
});
