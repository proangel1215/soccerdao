import { readFileSync } from "fs";
import sdk from "./1-initialize-sdk.js";

const bundleDrop = sdk.getBundleDropModule('0x5ebB9FdCCED59a2722a390D370fe4b8a0bAA7849');

(async () => {
    try {
        await bundleDrop.createBatch([
            {
                name: "A boy hoping to be a star",
                description: "This NFT will give you access to SoccerDAO!",
                image: readFileSync("scripts/assets/passboy.png"),
            },
        ]);
        console.log("✅ Successfully created a new NFT in the drop!");
    } catch (error) {
        console.error("failed to create the new NFT", error);
    }
})();