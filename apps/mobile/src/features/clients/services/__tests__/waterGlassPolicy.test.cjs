'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWaterGlasses } = require('../../../../shared/utils/waterGlassPolicy.cjs');
const { addWaterLiters, getWaterProgress, removeWaterLiters } = require('../../../../shared/utils/waterTrackingContract.cjs');

for (const [target, expectedAmount] of [[2.5, 250], [3, 300], [3.5, 350], [0.5, 50], [10, 1000]]) {
    test(`${target} L: ten glass taps reach the exact goal with ${expectedAmount} ml portions`, () => {
        let water = 0;
        for (let tap = 0; tap < 10; tap += 1) {
            const glasses = buildWaterGlasses(water, target);
            assert.equal(glasses.fills.length, 10);
            assert.equal(glasses.amountMl, expectedAmount);
            assert.equal(glasses.isApproximate, false);
            assert.ok(glasses.fills.some((fill) => fill < 1));
            water = addWaterLiters(water, glasses.addAmountMl);
        }
        assert.equal(water, target);
        assert.equal(getWaterProgress(water, target), 1);
        assert.ok(buildWaterGlasses(water, target).fills.every((fill) => fill === 1));
    });
}

test('2.4 L does not fill every glass for a 3 L or 3.5 L goal', () => {
    for (const target of [3, 3.5]) {
        assert.ok(buildWaterGlasses(2.4, target).fills.some((fill) => fill < 1));
    }
    assert.deepEqual(buildWaterGlasses(2.4, 3).fills, [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]);
});

test('manual amounts partially fill glasses and the final tap only adds the remainder', () => {
    const partial = buildWaterGlasses(0.15, 2.5);
    assert.equal(partial.fills[0], 0.6);
    assert.equal(partial.addAmountMl, 250);
    const remaining = buildWaterGlasses(2.4, 2.5);
    assert.equal(remaining.addAmountMl, 100);
    assert.equal(addWaterLiters(2.4, remaining.addAmountMl), 2.5);
});

test('non-divisible milliliter targets finish exactly on the tenth tap', () => {
    let water = 0;
    for (let tap = 0; tap < 10; tap += 1) {
        const glasses = buildWaterGlasses(water, 2.755);
        assert.equal(glasses.isApproximate, true);
        assert.equal(glasses.amountMl, 276);
        assert.ok(Number.isInteger(glasses.addAmountMl));
        if (tap === 9) assert.equal(glasses.addAmountMl, 271);
        water = addWaterLiters(water, glasses.addAmountMl);
    }
    assert.equal(water, 2.755);
    assert.equal(getWaterProgress(water, 2.755), 1);
    assert.ok(buildWaterGlasses(water, 2.755).fills.every((fill) => fill === 1));
});

test('every valid profile target from 250 through 10000 ml reaches its goal in ten taps', () => {
    for (let targetMl = 250; targetMl <= 10000; targetMl += 1) {
        const target = targetMl / 1000;
        let water = 0;
        for (let tap = 0; tap < 10; tap += 1) {
            const glasses = buildWaterGlasses(water, target);
            assert.ok(glasses.fills.some((fill) => fill < 1), `Goal filled early: ${targetMl} ml, tap ${tap}`);
            water = addWaterLiters(water, glasses.addAmountMl);
        }
        assert.equal(water, target);
        assert.ok(buildWaterGlasses(water, target).fills.every((fill) => fill === 1));
    }
});

test('changing the target rescales saved intake without changing the actual logged amount', () => {
    assert.ok(buildWaterGlasses(2.5, 2.5).fills.every((fill) => fill === 1));
    const higherGoal = buildWaterGlasses(2.5, 3.5);
    assert.equal(higherGoal.amountMl, 350);
    assert.equal(higherGoal.fills.filter((fill) => fill === 1).length, 7);
    assert.ok(higherGoal.fills.some((fill) => fill < 1));
    assert.ok(buildWaterGlasses(2.5, 2).fills.every((fill) => fill === 1));
});

test('above-goal intake remains recordable and minus restores partial progress', () => {
    const overGoal = addWaterLiters(3, buildWaterGlasses(3, 3).addAmountMl);
    assert.equal(overGoal, 3.3);
    assert.ok(buildWaterGlasses(overGoal, 3).fills.every((fill) => fill === 1));
    const reduced = removeWaterLiters(3, 300);
    assert.equal(reduced, 2.7);
    assert.equal(buildWaterGlasses(reduced, 3).fills[9], 0);
});

test('milliliter arithmetic avoids accumulated float errors during mixed add/remove actions', () => {
    let water = 0;
    for (let index = 0; index < 10; index += 1) water = addWaterLiters(water, 300);
    assert.equal(water, 3);
    assert.equal(removeWaterLiters(addWaterLiters(water, 1), 1), 3);
    assert.equal(removeWaterLiters(0.1, 300), 0);
});

test('missing and invalid goals use the existing 3 L fallback; invalid intake renders empty', () => {
    for (const target of [null, undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        const glasses = buildWaterGlasses(0, target);
        assert.equal(glasses.amountMl, 300);
        assert.equal(glasses.fills.length, 10);
    }
    for (const water of [null, undefined, -1, 'invalid', Number.NaN, Number.POSITIVE_INFINITY]) {
        assert.ok(buildWaterGlasses(water, 3).fills.every((fill) => fill === 0));
    }
});
