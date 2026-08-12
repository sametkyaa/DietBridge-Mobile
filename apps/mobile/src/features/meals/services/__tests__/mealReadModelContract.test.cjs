'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const source = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'mealReadModel.js'),
    'utf8',
);

test('mobile meal read model carries the canonical enum/source rules', () => {
    assert.match(source, /CANONICAL_MEAL_TYPES = \['breakfast', 'lunch', 'dinner', 'snack'\]/);
    assert.match(source, /source === 'manual' \|\| source === 'recipe'/);
    assert.match(source, /meal\.source alanı bulundu/);
    assert.match(source, /UUID_PATTERN/);
    assert.match(source, /source === 'manual' && recipeId !== null/);
});
