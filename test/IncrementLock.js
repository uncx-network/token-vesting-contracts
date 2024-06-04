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

    var totalSupply = '1000'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token = await ERC20Contract.deploy('Token 4', 'T4', totalSupply);
    await this.token.waitForDeployment();
    await this.token.transfer(this.alice.address, totalSupply / 2)
    await this.token.transfer(this.bob.address, totalSupply / 2)
  }),
  it("Should test a small Lock", async function() {
    var totalSupply = await this.token.totalSupply()
    await this.token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);
    await this.TOKEN_VESTING.editZeroFeeWhitelist(this.token.target, true) // zero fees

    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var nonceBefore = Number(await this.TOKEN_VESTING.NONCE())
    var startEmission = '0'
    var amountTokens = '100'
    var lockParams = [
      [this.alice.address, amountTokens, startEmission, fiveMinsFromNow, ethers.ZeroAddress]
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token.target, lockParams)
    expect(await this.token.balanceOf(this.TOKEN_VESTING.target)).to.equal(amountTokens);
  }),
  it("Should test an increment lock", async function() {
    await this.TOKEN_VESTING.connect(this.alice).incrementLock(0, 100)
    expect(await this.token.balanceOf(this.TOKEN_VESTING.target)).to.equal(200);
  }),
  it("Should allow another user / contract to increment another users lock", async function() {
    await this.token.connect(this.bob).approve(this.TOKEN_VESTING.target, 100);
    await this.TOKEN_VESTING.connect(this.bob).incrementLock(0, 100)
    expect(await this.token.balanceOf(this.TOKEN_VESTING.target)).to.equal(300);
  })
});

