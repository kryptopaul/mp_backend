const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

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
    console.log("Array:");
    console.log([highestSaleAmount, lastSaleAmount]);

    res.send(
        {
            tokenID: tokenID,
            highestSaleAmount: highestSaleAmount,
            lastSaleAmount: lastSaleAmount,
            sales: [highestSaleAmount, lastSaleAmount]
        }
    );
  } catch (error) {
    console.error(error);
    res.send("Error occurred");
  }
});

app.listen(port, () => {});
