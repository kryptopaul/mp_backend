const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

function calculateSalesStats(sales) {
  let highestSale = 0;
  let numHigherSales = 0;

  // track the highest sale and the number of sales higher than the last sale
  for (let i = 0; i < sales.length; i++) {
    if (sales[i].value > highestSale) {
      highestSale = sales[i].value;
      numHigherSales++;
    }
  }

  // Return 5 even if there are more "higher sales" because there's 5 stages of the NFT anyway.
  if (numHigherSales > 5) {
    numHigherSales = 5;
  }

  return numHigherSales;
}

app.get("/", async (req, res) => {
  const tokenID = Number(req.query.tokenID);

  //   if (tokenID > 5) {
  //     res.send("Invalid token ID");
  //     return;
  //   }

  try {
    const response = await axios.get(
      `https://api.public.cookie3.co/NftCollection/0x5af0d9827e0c53e4799bb226655a1de152a425a5/nftId/${tokenID}/transactions`
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

    const lastSaleAmount = lastSales[lastSales.length - 1].value;
    console.log("Last sale amount: " + lastSaleAmount);

    const stage = calculateSalesStats(lastSales);
    console.log("Stage: " + stage)

    res.send({
      tokenID: tokenID,
      highestSaleAmount: highestSaleAmount,
      lastSaleAmount: lastSaleAmount,
      sales: [highestSaleAmount, lastSaleAmount],
      stage: stage,
    });
  } catch (error) {
    console.error(error);
    res.send("Error occurred");
  }
});

app.listen(port, () => {
  console.log("Server started")
});
