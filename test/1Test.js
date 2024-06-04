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
    const UAdminContract = await hre.ethers.getContractFactory("UnicryptAdmin")
    this.UNI_ADMIN  = await UAdminContract.deploy()
    await this.UNI_ADMIN.waitForDeployment()
    await this.UNI_ADMIN.ownerEditAdmin(this.main_account.address, true)

    const TokenVestingContract = await hre.ethers.getContractFactory("TokenVesting")
    this.TOKEN_VESTING = await TokenVestingContract.deploy(this.UNI_ADMIN.target)
    await this.TOKEN_VESTING.waitForDeployment()
  }),
  it("Should test setting the Migrator contract", async function() {
    const MigratorContract = await hre.ethers.getContractFactory("Migrator");
    var MIGRATOR = await MigratorContract.deploy()
    await MIGRATOR.waitForDeployment()
    
    expect(await this.TOKEN_VESTING.MIGRATOR()).to.equal(ethers.ZeroAddress)
    await this.TOKEN_VESTING.setMigrator(MIGRATOR.target)
    expect(await this.TOKEN_VESTING.MIGRATOR()).to.equal(MIGRATOR.target)
  }),
  it("Should prevent bob from setting migrator contract", async function() {
    const MigratorContract = await hre.ethers.getContractFactory("Migrator");
    var MIGRATOR = await MigratorContract.deploy()
    await MIGRATOR.waitForDeployment()
    await expect (this.TOKEN_VESTING.connect(this.bob).setMigrator(ethers.ZeroAddress)).to.be.revertedWith('Ownable: caller is not the owner')
  }),
  it("Should test setting the BlackList contract", async function() {
    const TBContract = await hre.ethers.getContractFactory("TokenBlacklist");
    var BLACKLIST = await TBContract.deploy();
    await BLACKLIST.waitForDeployment();
    
    expect(await this.TOKEN_VESTING.BLACKLIST()).to.equal(ethers.ZeroAddress)
    await this.TOKEN_VESTING.setBlacklistContract(BLACKLIST.target)
    expect(await this.TOKEN_VESTING.BLACKLIST()).to.equal(BLACKLIST.target)
  }),
  it("Should prevent bob from setting BlackList contract", async function() {
    const TBContract = await hre.ethers.getContractFactory("TokenBlacklist");
    var BLACKLIST = await TBContract.deploy();
    await BLACKLIST.waitForDeployment();
    await expect (this.TOKEN_VESTING.connect(this.bob).setBlacklistContract(ethers.ZeroAddress)).to.be.revertedWith('Ownable: caller is not the owner')
  }),
  it("Should change Fee parameters", async function() {
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var feeToken = await ERC20Contract.deploy('Token 1', 'T1', '10000000');
    await feeToken.waitForDeployment();

    var tokenFee = '50'
    var freeLockingFee = '123'
    var feeAddress = this.carol.address
    var freeLockingToken = feeToken.target
    await this.TOKEN_VESTING.setFees(tokenFee, freeLockingFee, feeAddress, freeLockingToken)

    var feeStructAfter = await LockModel.getFees(this.TOKEN_VESTING)
    expect(feeStructAfter.tokenFee).to.equal(tokenFee)
    expect(feeStructAfter.freeLockingFee).to.equal(freeLockingFee)
    expect(feeStructAfter.feeAddress).to.equal(feeAddress)
    expect(feeStructAfter.freeLockingToken).to.equal(freeLockingToken)
  }),
  it("Should prevent bob from setting Fees", async function() {
    var tokenFee = '50'
    var freeLockingFee = '123'
    var feeAddress = this.carol.address
    var freeLockingToken = this.carol.address
    await expect (this.TOKEN_VESTING.connect(this.bob).setFees(tokenFee, freeLockingFee, feeAddress, freeLockingToken)).to.be.revertedWith('Ownable: caller is not the owner')
  })
});

