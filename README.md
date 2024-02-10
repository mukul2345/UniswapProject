# (Liquidity)

## Structure of the project
### 1. Smart contracts - `contract/` 
Smart contract are implemented with **Solidity** and require the **version 0.8.0** of the compiler. 
1. `ERC20Token.sol`   
Basic ERC20 Token contract used by Liquidity providers and trader to interact with the Dex

2. `DEX.sol`  
Decentralized market place where new liquidity pool can be created.  

3. `LiquidityPool.sol`  
Main file of the project. The liquidity pool contract represents a TokenA/TokenB liquidity pool.  
Liquidity providers can provide liquidity to the pool. They will then receive Liquidity Provider Tokens (LPTokens), which represent the share of the liquidity pool they own.   
When they withdraw the liquidity they provided, they will  be refunded with the same amount of token they deposits + the fees collected with all trades (0.5% on each trades).  
### 2. Tests - `test/`
Unit tests for `DEX.sol`, `LiquidityPool.sol` and `ERC20Token.sol` contracts. 

## How to run?
### Stack
* NodeJS (v >= 12.0.0)
* npm 
* Hardhat 
* Solidity (v0.8.0)

### Install dependencies and run tests
1. ` npm install`
2. `npx hardhat compile` (to compile contracts and generate artifacts)
3. `npx hardhat test` (to run existing unit tests)  

## Testing

Contracts have been tested using **Hardhat** framework and **Chai** library.   
To run the test, please make sure all dependencies are installed please type: `npx hardhat test`.

Bellow an overview of the result of the tests of contracts:

```
  DEX Contract
    Create new DEX
      √ New DEX is created (57ms)
    Create new Liquidity Pool
      √ New Pool for USDc/USDt is created (92ms)

  ERC20 Token Contract
    Deploy new ERC20 Token
      √ New contract is deployed with correct properties

  Liquidity Pool Contract
    Create new liquidity pool for USDc/USDt
      √ New liquidity pool is created
      √ Liquidity Pool LP Tokens is created with a total supply of 0
    USER 1 adds liquidity to the pool: 1000 USDc, 1000 USDt
      √ USDc Balance of Liquidity Pool is updated with 1000 USDc
      √ USDt Balance of Liquidity Pool is updated with 1000 USDt
      √ Liquidity Pool info are updated (43ms)
      √ 1000 new LP Tokens are minted => 1000 * 1000 / 1000
      √ LP Tokens Balance of USER 1 are updated with 1000 Tokens
    USER 2 adds liquidity to the pool: 1000 USDc, 1000 USDt
      √ USDc Balance of Liquidity Pool is updated => 1000 + 1000 = 2000 USDc
      √ USDt Balance of Liquidity Pool is updated => 1000 + 1000 = 2000 USDt
      √ Liquidity Pool info are updated (43ms)
      √ 2000 new LP Tokens are minted
      √ LP Tokens Balance of USER 2 are updated with 1000 Tokens
      √ USER 2 owns 50% of the pool
    Swap functionality
      √ USER 1 should see their TokenA balance reduced by 100 TokenA after swapping (43ms)
      √ USER 1 should see their TokenB balance increased after swapping (90ms)
      √ Liquidity pool reserves should be updated after swapping (67ms)
    Remove liquidity
      √ USER 1 should be able to remove liquidity and receive tokens back (74ms)


  20 passing (12s)
```



