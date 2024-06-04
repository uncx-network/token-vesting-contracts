const { expect } = require("chai");
const LockModel = require("./utils/LockModel.ts")

describe("Token Vesting", function() {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.main_account = this.signers[0]
    this.alice = this.signers[1]
    this.bob = this.signers[2]
    this.carol = this.signers[3]
    this.dev = this.signers[4]
    this.minter = this.signers[5]
  })
  it("Should test contract deployment", async function() {
    const UAdminContract = await hre.ethers.getContractFactory("UnicryptAdmin");
    this.UNI_ADMIN  = await UAdminContract.deploy();
    await this.UNI_ADMIN.waitForDeployment();
    await this.UNI_ADMIN.ownerEditAdmin(this.main_account.address, true)

    const TokenVestingContract = await hre.ethers.getContractFactory("TokenVesting");
    this.TOKEN_VESTING = await TokenVestingContract.deploy(this.UNI_ADMIN.target);
    await this.TOKEN_VESTING.waitForDeployment();

    const Base2Contract = await hre.ethers.getContractFactory("Base2");
    this.token = await Base2Contract.deploy();
    await this.token.waitForDeployment();
    await this.token.setPricer(this.main_account.address)
    var ts = await this.token.totalSupply()
    await this.token.transfer(this.alice.address, ts)
  }),
  it("Should test a small Lock", async function() {
    var totalSupply = await this.token.totalSupply()
    await this.token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);
    await this.TOKEN_VESTING.editZeroFeeWhitelist(this.token.target, true) // zero fees

    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var startEmission = '0'
    var amountTokens = '200'
    var lockParams = [
      [this.alice.address, amountTokens, startEmission, fiveMinsFromNow, ethers.ZeroAddress]
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token.target, lockParams)
    expect(await this.token.balanceOf(this.TOKEN_VESTING.target)).to.equal(amountTokens);
  }),
  it("Should rebase and affect the shares", async function() {
    var ts = await this.token.totalSupply()
    await this.token.rebase(ts) // simply double the supply
  }),
  it("Should test Lock withdrawl", async function() {
    await hre.ethers.provider.send("evm_increaseTime", [300])
    await hre.ethers.provider.send("evm_mine")
    await this.TOKEN_VESTING.connect(this.alice).withdraw(0, '2') // 2 shares = 1 token
    await this.TOKEN_VESTING.connect(this.alice).withdraw(0, '2')
  }),
  it("Should test a Large Lock", async function() {
    var aliceRemainingBalance = await this.token.balanceOf(this.alice.address)
    await this.token.connect(this.alice).approve(this.TOKEN_VESTING.target, aliceRemainingBalance);

    var startEmission = '0'
    var lockParams = [
      [this.alice.address, BigInt(aliceRemainingBalance) / BigInt(2), startEmission, 12, ethers.ZeroAddress],
      [this.alice.address, (BigInt(aliceRemainingBalance) / BigInt(2)) / BigInt(2), startEmission, 12, ethers.ZeroAddress]
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token.target, lockParams)
  })
});

