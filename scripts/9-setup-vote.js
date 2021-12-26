
import sdk from "./1-initialize-sdk.js";
import { ethers } from "ethers";

// This is our governance contract.
const voteModule = sdk.getVoteModule("0x91165ce03cb75EC9CE650BD89C5Ef4f02cB41D9E")
// This is our ERC-20 contract.
const tokenModule = sdk.getTokenModule("0x6A71E4Ce8E12fAf65D0cF8E1ae935DAc9cF334b0");

(async () => {
    try {
        // Give our treasury the power to mint additional token if needed.
        await tokenModule.grantRole("minter", voteModule.address);
        console.log("✅ Successfully gave vote module permissions to act on token module");
    } catch (err) {
        console.error("failed to grant vote module permissions on token modul");
    }

    try {
        // Grab our wallet's token balance, remember -- we hold basically the entire supply right now!
        const ownedTokenBalance = await tokenModule.balanceOf(process.env.WALLET_ADDRESS);

        // Grab 90% of the supply that we hold.
        const ownedAmount = ethers.BigNumber.from(ownedTokenBalance.value);
        const percent90 = ownedAmount.mul(90).div(100);

        // Transfer 90% of the supply to our voting contract.
        await tokenModule.transfer(voteModule.address, percent90);

        console.log("✅ Successfully transferred tokens to vote module");
    } catch (err) {
        console.error("failed to transfer tokens to vote module", err);
    }
})();
