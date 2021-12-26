import sdk from './1-initialize-sdk.js';

const app = sdk.getAppModule('0xB36d5A08Cb68720FdF587F9ffc98b5b679DdD74F');

(async () => {
    try {
        const tokenModule = await app.deployTokenModule({
            name: 'Token for SoccerDAO',
            symbol: 'SDT',
        })
        console.log("✅ You've successfully deployed your token moduule(SDT): ", tokenModule.address);
    } catch (error) {
        console.error("failed to deploy the token module: ", error);
    }
})();