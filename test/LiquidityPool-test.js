const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Liquidity Pool Contract', () => {

    beforeEach(async () => {

        TokenAContract = await ethers.getContractFactory('ERC20Token');
        TokenA = await TokenAContract.deploy("1000000000", "USDc", "USDc");
        [tokenAOwner, USER1, USER2, _] = await ethers.getSigners();

        TokenBContract = await ethers.getContractFactory('ERC20Token');
        TokenB = await TokenBContract.deploy("1000000000", "USDt", "USDt");
        [tokenBOwner, _, _, _] = await ethers.getSigners();

        await TokenA.transfer(USER1.address, 100000) 
        await TokenB.transfer(USER1.address, 100000)
        await TokenA.transfer(USER2.address, 100000) 
        await TokenB.transfer(USER2.address, 100000)
        

        LiquidityPoolContract = await ethers.getContractFactory('LiquidityPool');
        LiquidityPool = await LiquidityPoolContract.deploy("USDc / USDt", "USDc/USDt", TokenA.address, TokenB.address);
        [liquidityPoolOwner, _, _, _] = await ethers.getSigners();

    })

    describe('Create new liquidity pool for USDc/USDt', () => {
        it('New liquidity pool is created', async () => {
            expect(await LiquidityPool.symbol()).to.equal("USDc/USDt")
            expect(await LiquidityPool.name()).to.equal("USDc / USDt")
            expect(await LiquidityPool.addressTokenA()).to.equal(TokenA.address) 
            expect(await LiquidityPool.addressTokenB()).to.equal(TokenB.address)
        })
        it('Liquidity Pool LP Tokens is created with a total supply of 0', async () => {
            expect(await LiquidityPool.totalSupply()).to.equal(0)
        })
    })

    describe('USER 1 adds liquidity to the pool: 1000 USDc, 1000 USDt', () => {
        beforeEach( async () => {
            await TokenA.connect(USER1).approve(LiquidityPool.address, 100000)
            await TokenB.connect(USER1).approve(LiquidityPool.address, 100000)

            await LiquidityPool.connect(USER1).addLiquidity(1000, 1000)
        })

        it('USDc Balance of Liquidity Pool is updated with 1000 USDc', async () => {
            expect(await TokenA.balanceOf(LiquidityPool.address)).to.equal(1000)
        })
        it('USDt Balance of Liquidity Pool is updated with 1000 USDt', async () => {
            expect(await TokenB.balanceOf(LiquidityPool.address)).to.equal(1000)
        })
        it('Liquidity Pool info are updated', async () => {
            await LiquidityPool.sync()
            expect(await LiquidityPool.reserveTokenA()).to.equal(1000)
            expect(await LiquidityPool.reserveTokenB()).to.equal(1000) 

        })
        it('1000 new LP Tokens are minted => 1000 * 1000 / 1000', async () => {
            expect(await LiquidityPool.totalSupply()).to.equal(1000)
        })
        it('LP Tokens Balance of USER 1 are updated with 1000 Tokens', async () => {
            expect(await LiquidityPool.balanceOf(USER1.address)).to.equal(1000)
        })
    })


    describe('USER 2 adds liquidity to the pool: 1000 USDc, 1000 USDt', () => {
        beforeEach( async () => {
            await TokenA.connect(USER1).approve(LiquidityPool.address, 1000000)
            await TokenB.connect(USER1).approve(LiquidityPool.address, 1000000000)
            await LiquidityPool.connect(USER1).addLiquidity(1000, 1000)

            await TokenA.connect(USER2).approve(LiquidityPool.address, 1000000)
            await TokenB.connect(USER2).approve(LiquidityPool.address, 1000000000)

            await LiquidityPool.connect(USER2).addLiquidity(1000, 1000)
        })

        it('USDc Balance of Liquidity Pool is updated => 1000 + 1000 = 2000 USDc', async () => {
            expect(await TokenA.balanceOf(LiquidityPool.address)).to.equal(2000)
        })
        it('USDt Balance of Liquidity Pool is updated => 1000 + 1000 = 2000 USDt', async () => {
            expect(await TokenB.balanceOf(LiquidityPool.address)).to.equal(2000)
        })
        it('Liquidity Pool info are updated', async () => {
            await LiquidityPool.sync()
            expect(await LiquidityPool.reserveTokenA()).to.equal(2000)
            expect(await LiquidityPool.reserveTokenB()).to.equal(2000) 

        })
        it('2000 new LP Tokens are minted', async () => {
            expect(await LiquidityPool.totalSupply()).to.equal(2000)
        })
        it('LP Tokens Balance of USER 2 are updated with 1000 Tokens', async () => {
            expect(await LiquidityPool.balanceOf(USER2.address)).to.equal(1000)
        })
        it('USER 2 owns 50% of the pool', async () => {
            user2LpTokens = await LiquidityPool.balanceOf(USER2.address)
            totSupplyLpTokens = await LiquidityPool.totalSupply()
            expect(user2LpTokens/totSupplyLpTokens).to.equal(0.5)
        })
    })


    describe('Swap functionality', () => {
        beforeEach(async () => {
            // Approve tokens and add liquidity before each test
            await TokenA.connect(USER1).approve(LiquidityPool.address, 1000000);
            await TokenB.connect(USER1).approve(LiquidityPool.address, 1000000000);
            await LiquidityPool.connect(USER1).addLiquidity(1000, 1000);
        });
    
        it('USER 1 should see their TokenA balance reduced by 100 TokenA after swapping', async () => {
            await LiquidityPool.connect(USER1).swap(100, TokenA.address, TokenB.address);
            const balanceTokenA = await TokenA.balanceOf(USER1.address);
            expect(balanceTokenA).to.equal(98900);
        });
    
        it('USER 1 should see their TokenB balance increased after swapping', async () => {
            // Get the liquidity pool reserves before the swap
            const reserveTokenABefore = await LiquidityPool.reserveTokenA();
            const reserveTokenBBefore = await LiquidityPool.reserveTokenB();

            // Perform the swap of 100 TokenA to TokenB
            await LiquidityPool.connect(USER1).swap(100, TokenA.address, TokenB.address);
        
            // Get the liquidity pool reserves after the swap
            const reserveTokenAAfter = await LiquidityPool.reserveTokenA();
            const reserveTokenBAfter = await LiquidityPool.reserveTokenB();

            // Calculate the expected balance of TokenB based on the swap ratio
            let expectedBalanceB;
            if (reserveTokenAAfter > 0) {
                expectedBalanceB = ((reserveTokenBBefore).mul(100)).sub(reserveTokenBAfter);
            } else {
                expectedBalanceB = 0; 
            }

            // Get the actual balance of TokenB for USER1
            const balanceTokenB = await TokenB.balanceOf(USER1.address);

            // Assert that the actual balance of TokenB matches the expected balance
            expect(balanceTokenB).to.equal(expectedBalanceB);
        });
        
        it('Liquidity pool reserves should be updated after swapping', async () => {
            // Get the liquidity pool reserves before the swap
            const reserveTokenABefore = await LiquidityPool.reserveTokenA();
            const reserveTokenBBefore = await LiquidityPool.reserveTokenB();
        
            // Perform the swap of 100 TokenA to TokenB
            await LiquidityPool.connect(USER1).swap(100, TokenA.address, TokenB.address);
        
            // Get the liquidity pool reserves after the swap
            const reserveTokenAAfter = await LiquidityPool.reserveTokenA();
            const reserveTokenBAfter = await LiquidityPool.reserveTokenB();
            // Check if reserves have been updated correctly
            // Ensure that reserveTokenA has decreased and reserveTokenB has increased by the expected amounts
            expect(reserveTokenAAfter).to.equal(reserveTokenABefore.add(100));
            expect(reserveTokenBAfter).to.equal(reserveTokenBBefore.sub(90));
        });
    });


    describe('Remove liquidity', () => {
        beforeEach(async () => {
            // Approve tokens and add liquidity before each test
            await TokenA.connect(USER1).approve(LiquidityPool.address, 1000000);
            await TokenB.connect(USER1).approve(LiquidityPool.address, 1000000000);
            await LiquidityPool.connect(USER1).addLiquidity(1000, 1000);
        });
    
        it('USER 1 should be able to remove liquidity and receive tokens back', async () => {
            // Get the liquidity pool reserves before removing liquidity
            const reserveTokenABefore = await LiquidityPool.reserveTokenA();
            const reserveTokenBBefore = await LiquidityPool.reserveTokenB();
            const totalSupplyBefore = await LiquidityPool.totalSupply();
    
            // Remove liquidity by USER1
            await LiquidityPool.connect(USER1).removeLiquidity(totalSupplyBefore);
    
            // Get the liquidity pool reserves after removing liquidity
            const reserveTokenAAfter = await LiquidityPool.reserveTokenA();
            const reserveTokenBAfter = await LiquidityPool.reserveTokenB();
            const totalSupplyAfter = await LiquidityPool.totalSupply();
    
            // Check if the reserves have been updated correctly
            expect(reserveTokenAAfter).to.equal(reserveTokenABefore - 1000);
            expect(reserveTokenBAfter).to.equal(reserveTokenBBefore - 1000);
    
            // Check if USER1 receives tokens back
            const balanceTokenA = await TokenA.balanceOf(USER1.address);
            const balanceTokenB = await TokenB.balanceOf(USER1.address);
            // Assert that the balances of TokenA and TokenB for USER1 have increased after removing liquidity
            expect(balanceTokenA).to.equal(100000);
            expect(balanceTokenB).to.equal(100000);
    
            // Check if total supply of LP tokens has decreased
            expect(totalSupplyAfter).to.equal(0);
        });
    });   
})

