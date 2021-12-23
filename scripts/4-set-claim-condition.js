import sdk from "./1-initialize-sdk.js";

const bundleDrop = sdk.getBundleDropModule('0x5ebB9FdCCED59a2722a390D370fe4b8a0bAA7849');

(async () => {
    try {
        const claimConditionFactory = bundleDrop.getClaimConditionsFactory();
        claimConditionFactory.newClaimPhase({
            startTime: new Date(),
            maxQuantity: 50_0000,
            maxQuantityPerTransaction: 1,
        });
        await bundleDrop.setClaimCondition(0, claimConditionFactory);
        console.log('✅ Successfully set claime condition on bundleDrop: ', bundleDrop.address);
    } catch (error) {
        console.error('Failed to set claim condition', error);
    }
})();