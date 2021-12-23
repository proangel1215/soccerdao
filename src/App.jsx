import { useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@3rdweb/hooks";
import { ThirdwebSDK } from "@3rdweb/sdk";

// We instatiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK("rinkeby");

// We can grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule('0x5ebB9FdCCED59a2722a390D370fe4b8a0bAA7849');

const App = () => {

  // Use the connectWallet hook thirdweb gives us.
  const { connectWallet, address, error, provider } = useWeb3();
  console.log("👋 Address:", address);

  // The signer is required to sign transactions on the blockchain.
  // Without it we can only read data, not write.
  const signer = provider ? provider.getSigner(0) : undefined;

  // State variable for us to know if user has our NFT.
  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);
  // isClaiming lets us easily keep a loading state while the NFT is minting.
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    sdk.setProviderOrSigner(signer);
  }, [signer]);

  // when the 
  useEffect(() => {
    // If they don't have an connected wallet, exit!
    if (!address) return;

    // Check if the user has the NFT by using bundleDropModule.balanceOf
    return bundleDropModule
              .balanceOf(address, 0)
              .then((balance) => {
                // If balance is greater than 0, they have our NFT!
                if (balance.gt(0)) {
                  setHasClaimedNFT(true);
                  console.log("🌟 this user has a membership NFT!")
                } else {
                  setHasClaimedNFT(false);
                  console.log("😭 this user doesn't have a membership NFT.")
                }
              })
              .catch((error) => {
                setHasClaimedNFT(false);
                console.error('failed to get NFT balance', error);
              });
  }, [address]);

  // This is the case where the user hasn't connected their wallet
  // to your web app. Let them call connectWallet.
  if (!address) {
    return (
      <div className='landing'>
        <h1>Welcome to SoccerDao</h1>
        <button onClick={() => connectWallet("injected")} className='btn-hero'>
          Connect Your Wallet!!!
        </button>
      </div>
    );
  }

  const mintNft = () => {
    setIsClaiming(true);
    // Call bundleDropModule.claim("0", 1) to mint nft to user's wallet.
    bundleDropModule
      .claim("0", 1)
      .catch(err => {
        console.error('Failed to claim: ', err);
        setIsClaiming(false);
      })
      .finally(() => {
        console.log(
          `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
        );
        setHasClaimedNFT(true);
        setIsClaiming(false);
      });
  }

  // This is the case where we have the user's address
  // which means they've connected their wallet to our site!
  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>🍪DAO Member Page</h1>
        <p>Congratulations on being a member</p>
      </div>
    );
  } else {
    return (
      <div className="mint-nft">
        <h1>Mint your free 🍪DAO Membership NFT</h1>
        <button
          disabled={isClaiming}
          onClick={() => mintNft()}
        >
          {isClaiming ? "Minting..." : "Mint your NFT (free)!"}
        </button>
      </div>
    );
  }
};

export default App;
