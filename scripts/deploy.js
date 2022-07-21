const hre = require("hardhat")
const ethers = hre.ethers

async function main() {
  const [signer] = await ethers.getSigners()

  const Erc = await ethers.getContractFactory("OMGShop", signer)
  const erc = await Erc.deploy()
  await erc.deployed()

  console.log(erc.address)
  console.log(await erc.token())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
