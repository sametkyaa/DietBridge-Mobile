'use strict';

const { getUserError } = require('./userError.cjs');

function createErrorPresenter() {
  let sequence = 0;
  let queue = [];
  let scope;
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener(queue[0] ?? null));
  const show = (title, error, buttons, options = {}) => {
    const explanation = getUserError(error);
    const actions = Array.isArray(buttons) && buttons.length ? buttons : [{ text: 'Tamam' }];
    if (!actions.some((action) => action.onPress) && queue.some((item) => item.explanation.code === explanation.code && item.explanation.message === explanation.message)) return;
    queue.push({ id: ++sequence, title, explanation, actions, options });
    emit();
  };
  const close = (id, index) => {
    const current = queue[0];
    if (!current || current.id !== id) return false;
    if (index === undefined && current.options.cancelable !== true) return false;
    if (index !== undefined && (!Number.isInteger(index) || !current.actions[index])) return false;
    queue = queue.slice(1);
    emit();
    if (index === undefined) current.options.onDismiss?.();
    else current.actions[index]?.onPress?.();
    return true;
  };
  return {
    show, close,
    subscribe(listener) { listeners.add(listener); listener(queue[0] ?? null); return () => listeners.delete(listener); },
    setScope(nextScope) { if (scope !== undefined && scope !== nextScope) { queue = []; emit(); } scope = nextScope; },
    clear() { queue = []; emit(); },
  };
}
const errorPresenter = createErrorPresenter();
module.exports = { createErrorPresenter, errorPresenter };
