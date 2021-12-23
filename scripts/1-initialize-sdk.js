import { ThirdwebSDK } from "@3rdweb/sdk";
import ethers from "ethers";

//Importing and configuring our .env file that we use to securely store our environment variables
import dotenv from "dotenv";
dotenv.config();

// Some quick checks to make sure our .env is working.
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY == '') {
    console.log('🛑 Private key not found.');
}
if (!process.env.ALCHEMY_API_URL || process.env.ALCHEMY_API_URL == '') {
    console.log('🛑 Private key not found.');
}
if (!process.env.WALLET_ADDRESS || process.env.WALLET_ADDRESS == '') {
    console.log('🛑 Private key not found.');
}

const sdk = new ThirdwebSDK(
    new ethers.Wallet(
        process.env.PRIVATE_KEY,
        ethers.getDefaultProvider(process.env.ALCHEMY_API_URL),
    ),
);

(async () => {
    try {
        const apps = await sdk.getApps();
        console.log('👋 Your app address is ', apps[0].address);
    } catch (error) {
        console.error('Failed to get apps from sdk: ', error);
        process.exit(1);
    }
})();

// We are exporting the initialized thirdweb SDK so that we can use it in our other scripts
export default sdk;