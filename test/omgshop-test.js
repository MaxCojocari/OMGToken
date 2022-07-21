const { expect } = require("chai");
const { ethers } = require("hardhat");
const tokenJSON  = require("../artifacts/contracts/ERC20.sol/OMGToken.json")

describe("OMGShop", function () {
    let owner
    let buyer
    let shop
    let erc20

    // setup before every test 
    beforeEach(async function() {
      
      // generate accounts for owner and buyer
      [owner, buyer] = await ethers.getSigners()

      // getContractFactory - an abstraction used to deploy new smart contracts
      // OMGShop here is a factory for instances of "OMGShop" contract
      const OMGShop = await ethers.getContractFactory("OMGShop", owner)
      
      // deploy() will start the deployment, 
      // returns a Promise that resolves to a Contract
      shop = await OMGShop.deploy()
      await shop.deployed()

      erc20 = new ethers.Contract(await shop.token(), tokenJSON.abi, owner)
    })

    // Test nr.1
    it("should have an owner and a token", async function() {
      // check for owner's adddress corectness
      expect(await shop.owner()).to.eq(owner.address)

      // check if the token's address is OK
      expect(await shop.token()).to.be.properAddress
    })


    // Test nr.2
    it("allows to buy", async function() {
      const tokenAmount = 3 

      const txData = {
        value: tokenAmount,
        to: shop.address
      }

      // send transaction
      const tx = await buyer.sendTransaction(txData)
      await tx.wait()
      

      // AHTUNG! balanceOf function can be accessed only in the
      // context of ERC20 contract,
      // therefore we will use OMGToken.json abi for this purpose.

      // check if buyer's balance was supplied with tokenAmount
      expect(await erc20.balanceOf(buyer.address)).to.eq(tokenAmount)

      // tx should change wei balance of the shop
      await expect(() => tx).to.changeEtherBalance(shop, tokenAmount)
      
      // check if Bought event was emitted correspondingly
      await expect(tx).to.emit(shop, "Bought").withArgs(tokenAmount, buyer.address)
    })



    // Test nr.3
    it("allows to sell", async function() {
      const tokenAmount = 3 

      const txData = {
        value: tokenAmount,
        to: shop.address
      }

      const tx = await buyer.sendTransaction(txData)
      await tx.wait()

      const sellAmount = 2

      // connect buyer (first entity) to shop (second entity), 
      // and approve for shop an allowance of size sellAmount
      const approval = await erc20.connect(buyer).approve(shop.address, sellAmount)
      await approval.wait()

      // sell tokens
      const sellTx = await shop.connect(buyer).sell(sellAmount)
      await sellTx.wait()

      expect(await erc20.balanceOf(buyer.address)).to.eq(1)

      // because the shop bought the tokens, the shop eth balance
      // should decrease with sellAmount
      await expect(() => sellTx).to.changeEtherBalance(shop, -sellAmount)

      // check if Sold event was emitted correspondingly
      await expect(sellTx).to.emit(shop, "Sold").withArgs(sellAmount, buyer.address)

    })

});
