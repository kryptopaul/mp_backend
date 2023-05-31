const express = require("express");
const axios = require("axios");
const ethers = require("ethers");
const app = express();
const port = 3000;
require("dotenv").config();

app.use(express.static("public"));

// Some wallet with Nakamigos 0x77E3e957082Ca648c1C5b0F3e6AEc00Ab1245186

const miladypoland = "0x5af0d9827e0c53e4799bb226655a1de152a425a5"; //CHANGE LATER

const discordWebhook = process.env.DISCORD_WEBHOOK;
const cookie3apikey = process.env.COOKIE3_API_KEY;
const githubapikey = process.env.GITHUB_API_KEY;
const alchemyapikey = process.env.ALCHEMY_API_KEY;
const alchemygoerli = process.env.ALCHEMY_GOERLI;

// for debugging only
function waitTwoSeconds() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

// Mapping of NFT addresses to their Remilia scores
const remiliaInfo = new Map([
  ["0x5af0d9827e0c53e4799bb226655a1de152a425a5", 1], // milady
  ["0xd3d9ddd0cf0a5f0bfb8f7fceae075df687eaebab", 0.75], // remilio
  ["0x09f66a094a0070ebddefa192a33fa5d75b59d46b", 0.75], // yayo
  ["0xabcdb5710b88f456fed1e99025379e2969f29610", 0.5], // radbro
  ["0x8fc0d90f2c45a5e7f94904075c952e0943cfccfd", 0.5], // pixelady
]);

async function getOwnerOfTokenID(id) {
  try {
    const provider = new ethers.providers.AlchemyProvider(
      "goerli",
      alchemygoerli
    );
    const contract = new ethers.Contract(
      miladypoland,
      ["function ownerOf(uint256 tokenId) public view returns (address)"],
      provider
    );

    const owner = await contract.ownerOf(id);
    return owner;
  } catch (e) {
    console.log(e);
  }
}

async function calculateRemiliaScore(address) {
  try {
    let score = 0;
    const bayc = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
    const mayc = "0x60e4d786628fea6478f785a6d7e704777c86a7c6";
    const nakamigos = "0xd774557b647330c91bf44cfeab205095f7e6c367";
    const ben = "0x91364516D3CAD16E1666261dbdbb39c881Dbe9eE";

    const userNFTinfo = await axios.get(
      `https://api.public.cookie3.co/Wallet/nfts/${address}`,
      {
        headers: {
          Accept: "text/plain",
          "x-api-key": `${cookie3apikey}`,
        },
      }
    );
    const info = userNFTinfo.data;
    for (let i = 0; i < info.length; i++) {
      const e = info[i];

      // If any of the collection hashes are Nakamigos or BAYC/MAYC, return a clown emoji
      if (
        e.collectionHash === bayc ||
        e.collectionHash === mayc ||
        e.collectionHash === nakamigos
      ) {
        score = "🤡";
        break;
      }

      // Check if a value for a fetched NFT contract exists in the map
      if (remiliaInfo.has(e.collectionHash)) {
        // If it does, add the value to the score
        score += remiliaInfo.get(e.collectionHash);
      }
    }

    // Lastly, check if a user sent money to ben.eth
    const endpoint = `https://eth-mainnet.g.alchemy.com/v2/${alchemyapikey}`;
    const response = await axios.post(endpoint, {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: ben,
          category: ["external"],
          withMetadata: false,
          excludeZeroValue: true,
          maxCount: "0x3e8",
          fromAddress: address,
        },
      ],
    });

    console.log(
      "Transactions to ben.eth: " + response.data.result.transfers.length
    );
    if (response.data.result.transfers.length > 0) {
      score = "🤡";
    }

    console.log("Remilia score for address " + address + ": " + score);
    return score;
  } catch (error) {
    console.log(error);
  }
}

async function getContributions(token, username) {
  try {
    const headers = {
      Authorization: `bearer ${token}`,
    };
    const query = `{
      user(login: "kryptopaul") {
        email
        createdAt
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                weekday
                date
                contributionCount
                color
              }
            }
            months {
              name
              year
              firstDay
              totalWeeks
            }
          }
        }
      }
    }`;

    const response = await axios.post(
      "https://api.github.com/graphql",
      {
        query: query,
      },
      { headers: headers }
    );

    const creationDate = new Date(response.data.data.user.createdAt);
    const simpleDate =
      creationDate.getDate().toString().padStart(2, "0") +
      "-" +
      (creationDate.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      creationDate.getFullYear().toString();
    const contributions =
      response.data.data.user.contributionsCollection.contributionCalendar
        .totalContributions;
    return {
      date: simpleDate,
      contributions: contributions,
    };
  } catch (error) {
    console.log(error);
  }
}

function buildNFTMetadata(tokenID, remiliaScore, githubStats) {
  return {
    name: `Milady Poland #${tokenID}`,
    description: "Milady Poland - built with <3 for HackOnChain",
    image: `https://nft-backend-hackonchain.azurewebsites.net/api/image/1`,
    attributes: [
      {
        trait_type: "Remilia Score",
        value: remiliaScore.toString(),
      },
      {
        trait_type: "Developer Score",
        value: githubStats.contributions.toString(),
      },
      {
        trait_type: "Developer Since",
        value: githubStats.date.toString(),
      },
    ],
  };
}

app.get("/", async (req, res) => {
  const tokenID = Number(req.query.tokenID);

  //   if (tokenID > 5) {
  //     res.send("Invalid token ID");
  //     return;
  //   }

  try {
    axios.post(discordWebhook, {
      content: `Someone fetched metadata for token ID ${tokenID}`,
    });

    const owner = await getOwnerOfTokenID(tokenID);
    console.log(`Owner of token ID ${tokenID}: ${owner}`);

    const contributions = await getContributions(
      `${githubapikey}`,
      "kryptopaul"
    );
    console.log("GitHub Statistics: ");
    console.log("Developer since: " + contributions.date);
    console.log("Contributions: " + contributions.contributions);

    // Ratelimit :')
    await waitTwoSeconds();

    const remiliaScore = await calculateRemiliaScore(owner);

    const metadata = buildNFTMetadata(tokenID, remiliaScore, contributions);
    res.send(metadata);
  } catch (error) {
    console.error(error);
    res.send("Error occurred");
  }
});

app.get("/api/image/:id", async (req, res) => {
  const id = req.params.id;
  res.sendFile(__dirname + `/public/${id}.png`);
});

app.listen(port, () => {
  console.log("Server started!");
});
