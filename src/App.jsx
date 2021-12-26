import { useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@3rdweb/hooks";
import { ThirdwebSDK } from "@3rdweb/sdk";
import { ethers } from "ethers";

// We instatiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK("rinkeby");

// We can grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule('0x4f87e29bA7Ee65e997adDb20BA84bCC4d64A8d5a');
// We can grab a reference to our ERC-20 token contract.
const tokenModule = sdk.getTokenModule('0x6A71E4Ce8E12fAf65D0cF8E1ae935DAc9cF334b0');

// A fancy function to shorten someones wallet address, no need to show the whole thing. 
const shortenAddress = address => address.substring(0, 8) + "..." + address.substring(address.length - 4);

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
  // Holds the amount of token each member has in state.
  const [memberTokenAmounts, setMemberTokenAmounts] = useState({});
  // The array holding all of our members addresses.
  const [memberAddresses, setMemberAddresses] = useState([]);

  useEffect(() => {
    if ( !hasClaimedNFT ) return;

    // Grab the users who hold our NFT with tokenId 0.
    bundleDropModule
      .getAllClaimerAddresses(0)
      .then(addresses => {
        console.log("🚀 Members addresses", addresses)
        setMemberAddresses(addresses);
      })
      .catch(err => {
        console.error('failed to get claimer addresses: ', err);
      });

    // Grab all the balances.
    tokenModule
      .getAllHolderBalances()
      .then((amounts) => {
        console.log("👜 Amounts", amounts);
        setMemberTokenAmounts(amounts);
      })
      .catch((err) => {
        console.error("failed to get token amounts: ", err);
      });
  }, [hasClaimedNFT]);

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  const memberList = useMemo(() => {
    return memberAddresses.map(address => {
      return {
        address,
        tokenAmount: ethers.utils.formatUnits(
          // If the address isn't in memberTokenAmounts, it means they don't hold any of our token.
          memberTokenAmounts[address] || 0,
          18
          )
      }
    });
  }, [memberAddresses, memberTokenAmounts]);
  
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
      .catch((err) => {
        console.error('Failed to claim: ', err);
        setIsClaiming(false);
      })
      .finally(() => {
        setIsClaiming(false);
        setHasClaimedNFT(true);
        console.log(
          `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
        );
      });
  }

  // This is the case where we have the user's address
  // which means they've connected their wallet to our site!
  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>⚽ SoccerDAO Member Page ⚽</h1>
        <p>Congratulations on being a member</p>
        <div>
          <div>
            <h2>Member List</h2>
            <table className="card">
              <thead>
                <tr>
                  <th>@</th>
                  <th>Address</th>
                  <th>Token Amount (SDT)</th>
                </tr>
              </thead>
              <tbody>
                {
                  memberList.map((member) => (
                    <tr key={member.address}>
                      <td>{(member.address==address) ? "👉" : "⚽" }</td>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mint-nft">
        <h1>Mint your free ⚽SoccerDAO⚽ Membership NFT</h1>
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
