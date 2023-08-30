const express = require("express");
const axios = require("axios");
const ethers = require("ethers");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const port = 3000;
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));

const miladypoland = "0x5af0d9827e0c53e4799bb226655a1de152a425a5"; //CHANGE LATER

const discordWebhook = process.env.DISCORD_WEBHOOK;
const cookie3apikey = process.env.COOKIE3_API_KEY;
const githubapikey = process.env.GITHUB_API_KEY;
const alchemyapikey = process.env.ALCHEMY_API_KEY;

const connection = process.env.CONNECTION;
const schema = new mongoose.Schema({
  wallet: String,
  github: String,
});
const User = mongoose.model("User", schema);

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
      "mainnet",
      alchemyapikey
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
      user(login: "${username}") {
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

function calculateStage(sales) {
  if (sales.length === 0) {
    return 1;
  }

  try {
    let highestSale = 0;
    let numHigherSales = 0;

    // track the highest sale and the number of sales higher than the last sale
    for (let i = 0; i < sales.length; i++) {
      if (sales[i].value > highestSale) {
        highestSale = sales[i].value;
        numHigherSales++;
      }
    }

    // Return 4 even if there are more "higher sales" because there's 4 stages of the NFT anyway.
    if (numHigherSales > 4) {
      numHigherSales = 4;
    }

    return numHigherSales;
  } catch (error) {
    console.log(error);
  }
}

async function fetchLastSales(nftContract, id) {
  const response = await axios.get(
    `https://api.public.cookie3.co/NftCollection/${nftContract}/nftId/${id}/transactions`,
    {
      headers: {
        Accept: "text/plain",
        "x-api-key": `${cookie3apikey}`,
      },
    }
  );

  const lastSales = response.data
    .filter((sale) => sale.value && sale.value !== 0)
    .map((sale) => {
      return {
        value: sale.value,
      };
    });
  console.log(lastSales);

  const highestSaleAmount = Math.max.apply(
    Math,
    lastSales.map(function (o) {
      return o.value;
    })
  );
  console.log("Highest sale amount: " + highestSaleAmount);

  let lastSaleAmount;
  if (highestSaleAmount === -Infinity) {
    lastSaleAmount = 0;
  } else {
    lastSaleAmount = lastSales[lastSales.length - 1].value;
  }
  console.log("Last sale amount: " + lastSaleAmount);
  return lastSales;
}

async function getGithubUsername(address) {
  // get it from mongo
  await mongoose.connect(connection, {
    dbName: "MiladyPoland",
  });
  const user = await User.findOne({
    wallet: address,
  });
  return user ? user.github : "No Github Account";
}

function buildNFTMetadata(tokenID, remiliaScore, githubStats, stage) {
  return {
    name: `Milady Poland #${tokenID}`,
    description: "Milady Poland - built with <3 for HackOnChain",
    image: `https://nft-backend-hackonchain.azurewebsites.net/api/image/${stage}`,
    attributes: [
      {
        trait_type: "Remilia Score",
        value: remiliaScore.toString(),
      },
      {
        trait_type: "Developer Score",
        value: githubStats ? githubStats.contributions.toString() : '0',
      },
      {
        trait_type: "Developer Since",
        value: githubStats ? githubStats.date.toString() : 'N/A',
      },
      {
        trait_type: "Evolution Stage",
        value: stage.toString(),
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

    const lastSales = await fetchLastSales(
      "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
      tokenID
    );

    const stage = calculateStage(lastSales);
    console.log("Stage: " + stage);

    const githubUsername = await getGithubUsername(owner);
    console.log("Github username: " + githubUsername);

    let contributions;
    if (githubUsername !== "No Github Account") {
      contributions = await getContributions(`${githubapikey}`, githubUsername);
    }

    console.log(contributions);

    // Ratelimit :')
    await waitTwoSeconds();

    const remiliaScore = await calculateRemiliaScore(owner);
    console.log(remiliaScore);

    const metadata = buildNFTMetadata(
      tokenID,
      remiliaScore,
      contributions,
      stage
    );
    res.send(
      metadata
      // highestSaleAmount: highestSaleAmount,
      // lastSaleAmount: lastSaleAmount,
      // sales: [highestSaleAmount, lastSaleAmount],
      // stage: stage,
    );
  } catch (error) {
    console.error(error);
    res.send("Error occurred");
  }
});

app.get("/api/image/:id", async (req, res) => {
  const id = req.params.id;
  res.sendFile(__dirname + `/public/${id}.png`);
});

app.post("/add", bodyParser.json(), async (req, res) => {
  const { wallet, github } = req.body;
  await mongoose.connect(connection, {
    dbName: "MiladyPoland",
  });
  console.info("connected");
  const userObj = new User({
    wallet: wallet,
    github: github,
  });
  console.info("saving " + userObj);
  await userObj.save();
  console.info("saved");
  res.send(JSON.stringify("Success"));
});

app.get("/cebula", async (req, res) => {
  return res.sendFile(__dirname + "/public/cebula/cebula.png");
})

app.listen(port, () => {
  console.log("Server started!");
});
