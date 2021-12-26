
import { ethers } from 'ethers';
import sdk from './1-initialize-sdk.js';

const bundleDropModule = sdk.getBundleDropModule('0x4f87e29bA7Ee65e997adDb20BA84bCC4d64A8d5a');
const tokenModule = sdk.getTokenModule('0x6A71E4Ce8E12fAf65D0cF8E1ae935DAc9cF334b0');

(async () => {
    try {
        // Grab all the addresses of people who own our membership NFT, which has 
        // a tokenId of 0.
        const walletAddresses = await bundleDropModule.getAllClaimerAddresses(0);
        if (walletAddresses.length == 0) {
            console.log("No NFTs have been claimed yet!!!");
            process.exit(0);
        }

        const airdropTargets = walletAddresses.map(walletAddress => {
            // Pick a random # between 1000 and 10000.
            const randomAmount = Math.floor(Math.random() * (10000-1000+1) + 1000);
            console.log("✅ Going to airdrop", randomAmount, "tokens to", walletAddress);

            // Set up the target.
            return {
                address: walletAddress,
                amount: ethers.utils.parseUnits(randomAmount.toString(), 18),
            }
        });

        // Call transferBatch on all our airdrop targets.
        console.log("🌈 Starting airdrop...")
        await tokenModule.transferBatch(airdropTargets);
        console.log("✅ Successfully airdropped tokens to all the holders of the NFT!");
    } catch (err) {
        console.error("Failed to airdrop tokens", err);
    }
})();
