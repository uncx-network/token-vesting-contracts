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
    await this.token.transfer(this.alice.address, totalSupply)
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
    
    var nonceLast = Number(await this.TOKEN_VESTING.NONCE())
    expect(nonceLast).to.equal(nonceBefore + lockParams.length)
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonceLast - 1)
    expect(lock.lockID).to.equal(nonceLast - 1)
    expect(lock.tokensDeposited).to.equal(amountTokens)
  }),
  it("Should test Lock withdrawl", async function() {
    var totalSupply = await this.token.totalSupply()
    var alicePreBalance = Number(await this.token.balanceOf(this.alice.address))
    expect(alicePreBalance).to.equal(900)

    var lock1 = await LockModel.getLock(this.TOKEN_VESTING, 0)
    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(0, '100')).to.be.revertedWith("AMOUNT")
    const block = await hre.ethers.provider.getBlock("latest")
    await hre.ethers.provider.send("evm_increaseTime", [lock1.endEmission - block.timestamp])
    await hre.ethers.provider.send("evm_mine")

    await this.TOKEN_VESTING.connect(this.alice).withdraw(0, '100')
    expect(await this.token.balanceOf(this.alice.address)).to.equal(totalSupply);
  }),
  it("Should test a LARGE Lock deposit and withdrawl that has phantom overflow", async function() {
    var totalSupply = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 5', 'T5', totalSupply);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, totalSupply)
    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);

    var nonceBefore = Number(await this.TOKEN_VESTING.NONCE())
    var startEmission = '0'
    var amountTokens = '100000000000000000000000000000000000000000000000000000000000'
    var lockParams = [
      [this.alice.address, amountTokens, startEmission, '100', ethers.ZeroAddress]
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)

    var feeStruct = await LockModel.getFees(this.TOKEN_VESTING)
    var feeAddressBalance = await token.balanceOf(feeStruct.feeAddress)
    var lockerBalance = await token.balanceOf(this.TOKEN_VESTING.target)
    expect(BigInt(feeAddressBalance) + BigInt(lockerBalance)).to.equal(amountTokens);
    
    var nonceLast = Number(await this.TOKEN_VESTING.NONCE())
    expect(nonceLast).to.equal(nonceBefore + lockParams.length)
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonceLast - 1)
    expect(lock.lockID).to.equal(nonceLast - 1)
    expect(BigInt(feeAddressBalance) + BigInt(lock.tokensDeposited)).to.equal(amountTokens)

    await this.TOKEN_VESTING.connect(this.alice).withdraw(nonceLast - 1, lock.tokensDeposited)
    var aliceBalance = await token.balanceOf(this.alice.address)
    expect(BigInt(aliceBalance) + BigInt(feeAddressBalance)).to.equal('115792089237316195423570985008687907853269984665640564039457584007913129639935')
  })
});

