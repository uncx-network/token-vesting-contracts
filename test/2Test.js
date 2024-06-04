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

    var totalSupply = '1000'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token = await ERC20Contract.deploy('Token1', 'T1', totalSupply);
    await this.token.waitForDeployment();
  })
  it("Should test contract deployment", async function() {
    const UAdminContract = await hre.ethers.getContractFactory("UnicryptAdmin");
    this.UNI_ADMIN  = await UAdminContract.deploy();
    await this.UNI_ADMIN.waitForDeployment();
    await this.UNI_ADMIN.ownerEditAdmin(this.main_account.address, true)

    const TokenVestingContract = await hre.ethers.getContractFactory("TokenVesting");
    this.TOKEN_VESTING = await TokenVestingContract.deploy(this.UNI_ADMIN.target);
    await this.TOKEN_VESTING.waitForDeployment();
  }),
  it("Should test setting the Token whitelisters", async function() {   
    expect(await this.TOKEN_VESTING.getTokenWhitelisterLength()).to.equal(0)

    await this.TOKEN_VESTING.adminSetWhitelister(this.carol.address, true)
    expect(await this.TOKEN_VESTING.getTokenWhitelisterLength()).to.equal(1)
    expect(await this.TOKEN_VESTING.getTokenWhitelisterAtIndex(0)).to.equal(this.carol.address)
  }),
  it("Should prevent bob from setting a Token whitelister", async function() {
    await expect (this.TOKEN_VESTING.connect(this.bob).adminSetWhitelister(this.bob.address, true)).to.be.revertedWith('Ownable: caller is not the owner')
  }),
  it("Should test removing a Token whitelisters", async function() {   
    expect (await this.TOKEN_VESTING.getTokenWhitelisterStatus(this.carol.address)).to.equal(true)
    await this.TOKEN_VESTING.adminSetWhitelister(this.carol.address, false)
    expect (await this.TOKEN_VESTING.getTokenWhitelisterStatus(this.carol.address)).to.equal(false)
    expect(await this.TOKEN_VESTING.getTokenWhitelisterLength()).to.equal(0)
  }),
  it("Should pay for free token locks", async function() {   
    expect (await this.TOKEN_VESTING.tokenOnZeroFeeWhitelist(this.token.target)).to.equal(false)
    var feeStruct = await LockModel.getFees(this.TOKEN_VESTING)
    await this.TOKEN_VESTING.payForFreeTokenLocks(this.token.target, {value: feeStruct.freeLockingFee })
    expect (await this.TOKEN_VESTING.tokenOnZeroFeeWhitelist(this.token.target)).to.equal(true)
  }),
  it("Fail to pay for a token already listed for free locking", async function() {
    var feeStruct = await LockModel.getFees(this.TOKEN_VESTING)
    await expect(this.TOKEN_VESTING.payForFreeTokenLocks(this.token.target, {value: feeStruct.freeLockingFee })).to.be.revertedWith('PAID')
  }),
  it("editZeroFeeWhitelist test", async function() {
    await expect(this.TOKEN_VESTING.connect(this.bob).editZeroFeeWhitelist(this.token.target, true)).to.be.revertedWith('ADMIN')
    await this.UNI_ADMIN.ownerEditAdmin(this.bob.address, true)
    await this.TOKEN_VESTING.connect(this.bob).editZeroFeeWhitelist(this.token.target, true)
  })
});

