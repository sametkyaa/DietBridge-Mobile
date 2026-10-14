'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const { getUserError } = require('../userError.cjs');
const { createErrorPresenter } = require('../errorPresenter.cjs');

// Render actual JSX into inspectable elements with native surfaces isolated.
const elements = (root, type) => {
  if (!root || typeof root !== 'object') return [];
  return [...(root.type === type ? [root] : []), ...[root.props?.children].flat(Infinity).flatMap(child => elements(child, type))];
};
const text = root => [root?.props?.children].flat(Infinity).map(child => typeof child === 'object' ? text(child) : child ?? '').join('');
function renderModule(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, '../../..', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = babel.transformSync(source, {
    filename, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  }).code;
  const native = { Modal: 'Modal', ScrollView: 'ScrollView', View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', StyleSheet: { create: value => value } };
  const react = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }), useState: initial => [initial, () => {}], useEffect: fn => fn() };
  const themeFile = path.resolve(__dirname, '../../theme/colors.js');
  const colors = new Function(fs.readFileSync(themeFile, 'utf8').replace('export const colors', 'const colors') + '; return colors;')();
  const module = { exports: {} };
  const mockedRequire = name => {
    if (name in dependencies) return dependencies[name];
    if (name === 'react') return react;
    if (name === 'react-native') return native;
    if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
    if (name.endsWith('/theme')) return { colors, spacing: { x2: 8, x3: 12, x4: 16, x5: 20, x6: 24 }, radius: { card: 22, control: 16, round: 999 }, typography: { bodyMedium: {}, button: {} } };
    if (name.endsWith('/AppButton')) return { AppButton: 'AppButton' };
    if (name.endsWith('/Icon')) return { Icon: 'Icon' };
    if (name.endsWith('/ui')) return { AppButton: 'AppButton', InlineAlert: 'InlineAlert' };
    if (name.endsWith('/userError.cjs')) return require('../userError.cjs');
    throw new Error(`Missing isolated boundary: ${name}`);
  };
  new Function('require', 'module', 'exports', transformed)(mockedRequire, module, module.exports);
  return module.exports;
}

test('branded error modal renders safe explanation, accessible code and keeps retry/cancel actions', () => {
  const presenter = createErrorPresenter();
  let current;
  let retries = 0;
  presenter.subscribe(value => { current = value; });
  presenter.show('Hata', { message: 'Network request failed' }, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Tekrar dene', onPress: () => { retries += 1; } }]);
  const react = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }), useState: () => [current, () => {}], useEffect: fn => fn() };
  const Host = renderModule('shared/components/ui/AppErrorHost.js', { react, '../../utils/errorPresenter.cjs': { errorPresenter: presenter } }).default;
  const tree = Host({ scopeKey: 'fixture' });
  assert.equal(tree.type, 'Modal');
  assert.equal(tree.props.visible, true);
  assert.equal(tree.props.transparent, true);
  assert.match(text(tree), /DB-NETWORK-UNAVAILABLE/);
  assert.match(text(tree), /İnternet bağlantını kontrol/);
  assert.equal(elements(tree, 'SafeAreaView')[0].props.edges.length, 4);
  const buttons = elements(tree, 'AppButton');
  assert.deepEqual(buttons.map(x => x.props.variant), ['secondary', 'primary']);
  buttons[1].props.onPress(); buttons[1].props.onPress();
  assert.equal(retries, 1);
});

test('page error state uses a DietBridge card, selectable code and original retry callback', () => {
  const { ErrorState } = renderModule('shared/components/ui/ErrorState.js');
  let retry = 0;
  const tree = ErrorState({ title: 'Plan yüklenemedi', description: 'private database response', onRetry: () => { retry += 1; } });
  assert.match(text(tree), /Plan yüklenemedi/);
  assert.match(text(tree), /DB-LOAD-FAILED/);
  assert.doesNotMatch(text(tree), /private database/);
  assert(elements(tree, 'View').some(x => x.props.style?.borderRadius === 22 && x.props.style?.backgroundColor === '#FFFFFF'));
  assert(elements(tree, 'Text').some(x => x.props.selectable));
  elements(tree, 'AppButton')[0].props.onPress();
  assert.equal(retry, 1);
});

test('startup health gate needs persisted choices; checking unsaved boxes is insufficient', () => {
  const states = [
    { state: { enabled: true, updated_at: null, storage_granted: false, sharing_granted: false }, storage: true, sharing: true },
    { state: { enabled: true, updated_at: 'time', storage_granted: true, sharing_granted: true }, storage: true, sharing: false },
    { state: { enabled: true, updated_at: 'time', storage_granted: true, sharing_granted: true }, storage: true, sharing: true },
  ];
  for (const [index, vm] of states.entries()) {
    let ready;
    const Panel = renderModule('features/healthConsent/components/HealthConsentPanel.js', {
      '../viewmodels/useHealthConsentViewModel': { useHealthConsentViewModel: () => ({ visible: true, ...vm }) },
      '../../../shared/utils/externalLinkPolicy.cjs': { KVKK_URL: 'https://example.test/kvkk' },
      '../../../shared/utils/externalLinking': { openExternalLink: () => {} },
    }).default;
    Panel({ requireAcceptance: true, onReadinessChange: value => { ready = value; } });
    assert.equal(ready, index === 2);
  }
});

test('settings continue to allow withdrawing health consent while startup disables saving incomplete choices', () => {
  const Panel = renderModule('features/healthConsent/components/HealthConsentPanel.js', {
    '../viewmodels/useHealthConsentViewModel': { useHealthConsentViewModel: () => ({ visible: true, state: { enabled: true }, storage: false, sharing: false }) },
    '../../../shared/utils/externalLinkPolicy.cjs': { KVKK_URL: 'https://example.test/kvkk' },
    '../../../shared/utils/externalLinking': { openExternalLink: () => {} },
  }).default;
  assert.equal(Boolean(elements(Panel({}), 'AppButton')[0].props.disabled), false);
  assert.equal(elements(Panel({ requireAcceptance: true }), 'AppButton')[0].props.disabled, true);
});

test('field validation stays beside the input and is available to a screen reader', () => {
  const { AppInput } = renderModule('shared/components/ui/AppInput.js');
  const tree = AppInput({ label: 'Şifre', value: 'abc', error: getUserError({ code: 'AUTH_PASSWORD_SHORT' }), hint: 'Şifre kuralları' });
  assert.match(text(tree), /en az 6 karakter/);
  assert.match(elements(tree, 'TextInput')[0].props.accessibilityHint, /DB-AUTH-PASSWORD-SHORT/);
  assert.equal(elements(tree, 'TextInput')[0].props.value, 'abc');
});

test('error adapter keeps successful and destructive confirmation alerts native while failures use the branded host', () => {
  const presenter = createErrorPresenter();
  const nativeCalls = [];
  let dismissedKeyboard = 0;
  let current;
  presenter.subscribe(value => { current = value; });
  const { Alert } = renderModule('shared/utils/errorAlert.js', {
    'react-native': { Alert: { alert: (...args) => nativeCalls.push(args) }, Keyboard: { dismiss: () => { dismissedKeyboard += 1; } } },
    './errorPresenter.cjs': { errorPresenter: presenter },
  });
  const buttons = [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive' }];
  Alert.alert('Başarılı', 'Ölçüler kaydedildi.');
  Alert.alert('Mesajı sil', 'Mesaj silinsin mi?', buttons);
  assert.equal(nativeCalls.length, 2);
  assert.equal(nativeCalls[1][2], buttons);
  assert.equal(current, null);
  Alert.alert('Fotoğraf eklenemedi', 'Lütfen tekrar deneyin.');
  assert.equal(nativeCalls.length, 2);
  assert.equal(current.explanation.code, 'DB-PHOTO-SELECTION-FAILED');
  assert.equal(dismissedKeyboard, 1);
});

test('onboarding routes Android back to the previous step, removes listeners and permits an explicit finish', () => {
  let hardware;
  let beforeRemove;
  let cleanup;
  let finish;
  let removed = 0;
  let backs = 0;
  let resets = 0;
  const navigation = {
    canGoBack: () => true,
    addListener: (_event, callback) => { beforeRemove = callback; return () => { removed += 1; }; },
    reset: () => {
      let prevented = false;
      beforeRemove({ preventDefault: () => { prevented = true; } });
      assert.equal(prevented, false, 'Completing onboarding must not be redirected back into a step');
      resets += 1;
    },
  };
  const Screen = renderModule('features/onboarding/screens/OnboardingSetupScreen.js', {
    react: { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }), useCallback: fn => fn, useRef: value => ({ current: value }) },
    'react-native': { ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: value => value },
      BackHandler: { addEventListener: (_event, callback) => { hardware = callback; return { remove: () => { removed += 1; } }; } } },
    '@react-navigation/native': { useFocusEffect: callback => { cleanup = callback(); } },
    '../../auth/components/BrandMark': { PlateMark: 'PlateMark' },
    '../../clients/constants/profileOptions': { COMMON_FOOD_INTOLERANCES: [] },
    '../components/OnboardingConnectStep': 'OnboardingConnectStep',
    '../components/OnboardingNumberField': 'OnboardingNumberField',
    '../components/OnboardingOptionCard': 'OnboardingOptionCard',
    '../components/OnboardingStepLayout': 'OnboardingStepLayout',
    '../viewmodels/useOnboardingSetupViewModel': { ONBOARDING_STEPS: { GOAL: 'goal', BODY: 'body', CONNECT: 'connect' },
      useOnboardingSetupViewModel: props => {
        finish = props.onExit;
        return { step: 'body', steps: ['goal', 'body'], stepIndex: 1, loadStatus: 'loading', back: () => { backs += 1; return true; } };
      } },
  }).default;
  Screen({ navigation, userId: 'fixture' });
  assert.equal(hardware(), true);
  assert.equal(backs, 1);
  let prevented = false;
  beforeRemove({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(backs, 2);
  finish();
  assert.equal(resets, 1);
  cleanup();
  assert.equal(removed, 2);
});
