import { UnsupportedChainIdError } from "@web3-react/core";
import { useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@3rdweb/hooks";
import { ThirdwebSDK } from "@3rdweb/sdk";
import { ethers } from "ethers";

// We instatiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK("rinkeby");

const bundleDropModule = sdk.getBundleDropModule('0x4f87e29bA7Ee65e997adDb20BA84bCC4d64A8d5a');
const tokenModule = sdk.getTokenModule('0x6A71E4Ce8E12fAf65D0cF8E1ae935DAc9cF334b0');
const voteModule = sdk.getVoteModule("0x91165ce03cb75EC9CE650BD89C5Ef4f02cB41D9E");

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

  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

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

    // Retrieve all our existing proposals from the contract.
    voteModule
      .getAll()
      .then(proposals => {
        setProposals(proposals);
        console.log("🌈 Proposals:", proposals)
      })
      .catch(err => {
        console.error("failed to get proposals", err);
      });
  }, [hasClaimedNFT]);

  // We also need to check if the user already voted.
  useEffect(() => {
    if ( !hasClaimedNFT || !proposals.length )  return;
    // Check if the user has already voted on the first proposal.
    voteModule
      .hasVoted(proposals[0].proposalId, address)
      .then(hasVoted => {
        setHasVoted(hasVoted);
        if ( hasVoted ) console.log("🥵 User has already voted")
      })
      .catch((err) => {
        console.error("failed to check if wallet has voted", err);
      });
  }, [hasClaimedNFT, proposals, address]);

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

  if ( error instanceof UnsupportedChainIdError ) {
    return (
      <div className="unsupported-network">
        <h2>Please connect to Rinkeby</h2>
        <p>
          This dapp only works on the Rinkeby network, please switch networks
          in your connected wallet.
        </p>
      </div>
    );
  }

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

    const submitVote = async (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      
      setIsVoting(true);

      // lets get the votes from the form for the values
      const votes = proposals.map((proposal) => ({
        proposalId: proposal.proposalId,
        vote: document.querySelector('input[name="' + proposal.proposalId + '"]:checked').value,
      }));

      // first we need to make sure the user delegates their token to vote
      try {
        //we'll check if the wallet still needs to delegate their tokens before they can vote
        const delegation = await tokenModule.getDelegationOf(address);
        // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
        if ( delegation === ethers.constants.AddressZero ) {
          //if they haven't delegated their tokens yet, we'll have them delegate them before voting
          await tokenModule.delegateTo(address);
        }

        // then we need to vote on the proposals
        try {
          await Promise.all(
            votes.map(async vote => {
              // before voting we first need to check whether the proposal is open for voting
              // we first need to get the latest state of the proposal
              const proposal = await voteModule.get(vote.proposalId);
              // then we check if the proposal is open for voting (state === 1 means it is open)
              if ( proposal.state === 1 ) {
                // if it is open for voting, we'll vote on it
                return voteModule.vote(vote.proposalId, vote.vote);
              }
              // if the proposal is not open for voting we just return nothing, letting us continue
              return;
            })
          );

          try {
            // if any of the propsals are ready to be executed we'll need to execute them
            // a proposal is ready to be executed if it is in state 4
            await Promise.all(
              votes.map(async vote => {
                // we'll first get the latest state of the proposal again, since we may have just voted before
                const proposal = await voteModule.get(vote.proposalId);
                //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                if ( proposal.state === 4 ) {
                  // if it is open for voting, we'll vote on it
                  return voteModule.execute(vote.proposalId);
                }
              })
            );

            // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
            setHasVoted(true);
            // and log out a success message
            console.log("successfully voted");

          } catch (err) {
            console.error("failed to execute votes", err);
          }
        } catch (err) {
          console.error("failed to vote", err);
        }
      } catch (err) {
        console.error("failed to delegate tokens");
      } finally {
        // in *either* case we need to set the isVoting state to false to enable the button again
        setIsVoting(false);
      }
    }

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
                      <td>{(member.address===address) ? "👉" : "⚽" }</td>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <div>
            <h2>Active proposals</h2>
            <form onSubmit={(evt) => submitVote(evt)}>
              {
                proposals.map((proposal) => (
                  <div key={proposal.proposalId} className="card">
                    <h4>{proposal.description}</h4>
                    <div>
                      {proposal.votes.map(vote => (
                        <div key={vote.type}>
                          <input
                            type="radio"
                            value={vote.type}
                            id={proposal.proposalId + "-" + vote.type}
                            name={proposal.proposalId}
                            defaultChecked={vote.type === 2}
                          />
                          <label
                            htmlFor={proposal.proposalId + "-" + vote.type}
                          >
                            {vote.label}
                          </label>
                        </div>
                        )
                      )}
                    </div>
                  </div>
                ))
              }
              <button disabled={isVoting || hasVoted} type="submit">
                {
                  isVoting ? "Voting..." : (hasVoted ? "Already Voted!!!" : "Submit Vote!")
                }
              </button>
            </form>
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
