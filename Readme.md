# MiladyPoland - WWW Demo

## Note

This is a version for the Weekly Web3 Workshops demo. While the original idea was to build a fun derivative of Milady with metadata dependent of the holder's on-chain data, this will focus on the technical aspects of the project.

## Features

### Remilia score

- The trait `Remilia Score` calculates the total Remilia ecosystem NFTs of the holder and returns a numeric value. The NFTs and the points are as in this table:

| NFT name | Points |
| -------- | ------ |
| Milady   | 1      |
| Remilio  | 0.75   |
| Yayo     | 0.75   |
| Radbro   | 0.5    |
| Pixelady | 0.5    |

#### On-Chain Clowns

Not all users are deserving of this score however. The users who've demonstrated their behaviour as "On-Chain Clowns" will receive a clown (🤡) emoji as a value for this trait.

The following behaviours are considered "On-Chain Clown" behaviour:
- Owning a Bored or Mutant Ape
- Having ever sent ETH to ben.eth

### GitHub score
As of the demo, my Github account is hardcoded.

The trait `GitHub Score` calculates and returns the total number of contributions of the user.

The trait `Developer since` returns the date of opening the Github account.