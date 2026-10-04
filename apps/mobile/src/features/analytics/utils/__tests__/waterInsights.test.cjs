'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    buildWaterSeries,
    describeWaterSummary,
    formatLiters,
    summarizeWaterSeries,
} = require('../waterInsights.cjs');

const week = [
    { dateKey: '2026-09-28', amount: 2.1 },
    { dateKey: '2026-09-29', amount: 1.8 },
    { dateKey: '2026-09-30', amount: 2.4 },
    { dateKey: '2026-10-01', amount: 1.5 },
    { dateKey: '2026-10-02', amount: 2.6 },
    { dateKey: '2026-10-03', amount: 2.2 },
    { dateKey: '2026-10-04', amount: 1.3 },
];

test('builds one entry per day ending today, keeping missing days as gaps', () => {
    const series = buildWaterSeries([{ dateKey: '2026-10-04', amount: 1 }, { dateKey: '2026-10-02', amount: 2 }], '2026-10-04', 7);
    assert.equal(series.length, 7);
    assert.equal(series[0].dateKey, '2026-09-28');
    assert.equal(series[6].dateKey, '2026-10-04');
    assert.equal(series[6].day, 'Paz');
    assert.equal(series[6].dateLabel, '4 Eki');
    assert.deepEqual(series.map((item) => item.amount), [null, null, null, null, 2, null, 1]);
});

test('30 day series crosses month boundaries', () => {
    const series = buildWaterSeries(week, '2026-10-04', 30);
    assert.equal(series.length, 30);
    assert.equal(series[0].dateKey, '2026-09-05');
    assert.equal(series.filter((item) => item.amount !== null).length, 7);
});

test('ignores entries outside the window and non-numeric amounts', () => {
    const series = buildWaterSeries([{ dateKey: '2026-08-01', amount: 3 }, { dateKey: '2026-10-04', amount: 'x' }], '2026-10-04', 7);
    assert.ok(series.every((item) => item.amount === null));
});

test('summary averages logged days and counts goal days', () => {
    const summary = summarizeWaterSeries(buildWaterSeries(week, '2026-10-04', 7), 2.2);
    assert.equal(summary.loggedDays, 7);
    assert.equal(summary.missingDays, 0);
    assert.equal(formatLiters(summary.total), '13,9');
    assert.equal(formatLiters(summary.average), '2,0');
    assert.equal(summary.goalDays, 3);
    assert.equal(summary.best.amount, 2.6);
    assert.equal(summary.best.day, 'Cum');
    assert.equal(summary.lowest.dayName, 'Pazar');
});

test('a day logged as 2,2 L by 200 ml steps still reaches a 2,2 L goal', () => {
    const amount = [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2].reduce((a, b) => a + b, 0);
    const summary = summarizeWaterSeries(buildWaterSeries([{ dateKey: '2026-10-04', amount }], '2026-10-04', 7), 2.2);
    assert.equal(summary.goalDays, 1);
});

test('empty series has no average', () => {
    const summary = summarizeWaterSeries(buildWaterSeries([], '2026-10-04', 7), 2);
    assert.equal(summary.average, null);
    assert.equal(summary.best, null);
    assert.equal(describeWaterSummary(summary, 2), 'Son 7 günde su kaydı yok.');
});

test('description mentions goal days, the lowest day and the remaining amount', () => {
    const summary = summarizeWaterSeries(buildWaterSeries(week, '2026-10-04', 7), 2.5);
    assert.equal(
        describeWaterSummary(summary, 2.5),
        'Son 7 günün 1 gününde hedefe ulaştın. En düşük gün Pazar oldu, 1,3 L. Hedefe ulaşmak için günde ortalama 0,5 L daha içmen yeterli.',
    );
});

test('description mentions missing days instead of the lowest day', () => {
    const summary = summarizeWaterSeries(buildWaterSeries(week, '2026-10-04', 30), 1.5);
    assert.equal(describeWaterSummary(summary, 1.5), 'Son 30 günün 6 gününde hedefe ulaştın. 23 gün kayıt girilmedi.');
});
