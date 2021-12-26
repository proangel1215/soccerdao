import sdk from "./1-initialize-sdk.js";

const bundleDrop = sdk.getBundleDropModule('0x4f87e29bA7Ee65e997adDb20BA84bCC4d64A8d5a');

(async () => {
    try {
        const claimConditionFactory = bundleDrop.getClaimConditionsFactory();
        claimConditionFactory.newClaimPhase({
            startTime: new Date(),
            maxQuantity: 50_000,
            maxQuantityPerTransaction: 1,
        });
        await bundleDrop.setClaimCondition(0, claimConditionFactory);
        console.log('✅ Successfully set claim condition on bundleDrop: ', bundleDrop.address);
    } catch (error) {
        console.error('Failed to set claim condition: ', error);
    }
})();