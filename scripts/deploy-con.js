// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const UAdminContract = await hre.ethers.getContractFactory("UnicryptAdmin");
  const UNI_ADMIN = await UAdminContract.deploy();
  await UNI_ADMIN.waitForDeployment();

  const TokenVestingContract = await hre.ethers.getContractFactory("TokenVesting");
  const TOKEN_VESTING = await TokenVestingContract.deploy(UNI_ADMIN.target);
  await TOKEN_VESTING.waitForDeployment();

  const TokenVestingPager = await hre.ethers.getContractFactory("TokenVestingPager");
  const TOKEN_VESTING_PAGER = await TokenVestingPager.deploy(TOKEN_VESTING.target);
  await TOKEN_VESTING_PAGER.waitForDeployment();

  console.log("Unicrypt Admin:", UNI_ADMIN.target);
  console.log("Token Vesting:", TOKEN_VESTING.target);
  console.log("Pager:", TOKEN_VESTING_PAGER.target);
  console.log("Done");

  var secondsToSleep = 10
  for (var i = 0; i < secondsToSleep; i++) {
    console.log(`Sleeping for ${secondsToSleep - i} seconds`)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await hre.run("verify:verify", {
    address: TOKEN_VESTING.target,
    constructorArguments: [
      UNI_ADMIN.target
    ],
  });

  // Or manual verification
  // npx hardhat verify --contract contracts/TokenVesting.sol:TokenVesting --network base --constructor-args scripts/arguments.js 0xA82685520C463A752d5319E6616E4e5fd0215e33
  // npx hardhat verify --contract contracts/UnicryptAdmin.sol:UnicryptAdmin --network base 0x1fe6cC287feB08ce831dF0cd114341480ADCaA5A

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    // process.exit(0)
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
