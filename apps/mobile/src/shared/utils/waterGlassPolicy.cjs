'use strict';

const {
    WATER_TARGET_LITERS,
    normalizePersistedWaterLiters,
} = require('./waterTrackingContract.cjs');

const WATER_GLASS_COUNT = 10;

const buildWaterGlasses = (waterLiters, targetLiters) => {
    const requestedTargetMl = Math.round(targetLiters * 1000);
    const targetMl = Number.isSafeInteger(requestedTargetMl) && requestedTargetMl > 0
        ? requestedTargetMl
        : WATER_TARGET_LITERS * 1000;
    const count = Math.min(WATER_GLASS_COUNT, targetMl);
    const amountMl = Math.ceil(targetMl / count);
    const normalizedWater = normalizePersistedWaterLiters(waterLiters);
    const waterMl = normalizedWater !== null && Number.isFinite(normalizedWater)
        ? Math.round(normalizedWater * 1000)
        : 0;
    const completedGlasses = waterMl / targetMl * count;

    return {
        amountMl,
        isApproximate: targetMl % count !== 0,
        // The last tap completes the remaining goal; further taps still record actual intake.
        addAmountMl: waterMl < targetMl ? Math.min(amountMl, targetMl - waterMl) : amountMl,
        fills: Array.from({ length: count }, (_, index) => (
            Math.min(1, Math.max(0, completedGlasses - index))
        )),
    };
};

module.exports = { WATER_GLASS_COUNT, buildWaterGlasses };
