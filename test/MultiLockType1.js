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
  }),
  it("Should test a Multi Lock", async function() {
    var totalSupply = '1000'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token = await ERC20Contract.deploy('Token 4', 'T4', totalSupply);
    await this.token.waitForDeployment();
    await this.token.transfer(this.alice.address, totalSupply)

    await this.token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);
    await this.TOKEN_VESTING.editZeroFeeWhitelist(this.token.target, true) // zero fees

    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var nonceBefore = Number(await this.TOKEN_VESTING.NONCE())
    var lockParams = [
      [this.alice.address, '500', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '250', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '125', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.alice.address, '100', '0', fiveMinsFromNow, ethers.ZeroAddress],
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token.target, lockParams)
    expect(await this.token.balanceOf(this.TOKEN_VESTING.target)).to.equal('975');
    
    var nonceLast = Number(await this.TOKEN_VESTING.NONCE())
    expect(nonceLast).to.equal(nonceBefore + lockParams.length)
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonceLast - 1)
    expect(lock.lockID).to.equal(nonceLast - 1)
    expect(lock.tokensDeposited).to.equal('100')
  }),
  it("Should test Multi Lock withdrawls", async function() {
    var alicePreBalance = Number(await this.token.balanceOf(this.alice.address))
    expect(alicePreBalance).to.equal(25)

    var bobPreBalance = Number(await this.token.balanceOf(this.bob.address))
    expect(bobPreBalance).to.equal(0)

    var lock1 = await LockModel.getLock(this.TOKEN_VESTING, 0)
    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(0, '1')).to.be.revertedWith("AMOUNT")
    const block = await hre.ethers.provider.getBlock("latest")
    await hre.ethers.provider.send("evm_increaseTime", [lock1.endEmission - block.timestamp])
    await hre.ethers.provider.send("evm_mine")

    await this.TOKEN_VESTING.connect(this.alice).withdraw(0, '500')
    expect(await this.token.balanceOf(this.alice.address)).to.equal(alicePreBalance + 500);

    await this.TOKEN_VESTING.connect(this.bob).withdraw(1, '250')
    expect(await this.token.balanceOf(this.bob.address)).to.equal(bobPreBalance + 250);

    await this.TOKEN_VESTING.connect(this.bob).withdraw(2, '125')
    expect(await this.token.balanceOf(this.bob.address)).to.equal(bobPreBalance + 375);

    await this.TOKEN_VESTING.connect(this.alice).withdraw(3, '1')
    expect(await this.token.balanceOf(this.alice.address)).to.equal(alicePreBalance + 501);
  })
});

