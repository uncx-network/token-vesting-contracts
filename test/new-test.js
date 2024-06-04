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

  it("Generate tokens", async function() {
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token1 = await ERC20Contract.deploy('Token 1', 'T1', '10000000');
    await this.token1.waitForDeployment();
    await this.token1.transfer(this.alice.address, '10000000')
    expect(await this.token1.totalSupply()).to.equal('10000000')
  }),
  it("Should test contract deployment", async function() {
    const UAdminContract = await hre.ethers.getContractFactory("UnicryptAdmin");
    this.UNI_ADMIN  = await UAdminContract.deploy();
    await this.UNI_ADMIN.waitForDeployment();
    await this.UNI_ADMIN.ownerEditAdmin(this.main_account.address, true)

    const TokenVestingContract = await hre.ethers.getContractFactory("TokenVesting");
    this.TOKEN_VESTING = await TokenVestingContract.deploy(this.UNI_ADMIN.target);
    await this.TOKEN_VESTING.waitForDeployment();
  }),
  it("Test a lock Type 1 for alice with fee to fee address", async function() {
    await this.token1.connect(this.alice).approve(this.TOKEN_VESTING.target, '1000000');
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token1.target, [[this.alice.address, '1000000', '0', fiveMinsFromNow, ethers.ZeroAddress]])

    var lock = await LockModel.getLock(this.TOKEN_VESTING, 0)
    var feeStruct = await LockModel.getFees(this.TOKEN_VESTING)

    expect(lock.tokensDeposited).to.equal('996500');
    expect(await this.token1.balanceOf(this.TOKEN_VESTING.target)).to.equal('996500');
    expect(await this.token1.balanceOf(this.alice.address)).to.equal('9000000');
    expect(await this.token1.balanceOf(feeStruct.feeAddress)).to.equal('3500');
  }),
  it("Test a withdraw for alice and fail for bob", async function() {
    const block = await hre.ethers.provider.getBlock("latest")
    var lock = await LockModel.getLock(this.TOKEN_VESTING, 0)
    await expect(block.timestamp).to.be.lt(lock.endEmission)
    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(0, '6500')).to.be.revertedWith("AMOUNT")
    await hre.ethers.provider.send("evm_increaseTime", [lock.endEmission - block.timestamp])
    await expect(this.TOKEN_VESTING.connect(this.bob).withdraw(0, '6500')).to.be.revertedWith('OWNER');
    await this.TOKEN_VESTING.connect(this.alice).withdraw(0, '6500')
    expect(await this.token1.balanceOf(this.TOKEN_VESTING.target)).to.equal('990000');
    expect(await this.token1.balanceOf(this.alice.address)).to.equal('9006500');
  }),
  it("Test a ownership transfer to bob", async function() {
    await expect(this.TOKEN_VESTING.connect(this.alice).transferLockOwnership(0, this.alice.address)).to.be.revertedWith("SELF")
    await expect(this.TOKEN_VESTING.connect(this.bob).transferLockOwnership(0, this.alice.address)).to.be.revertedWith("OWNER")
    await this.TOKEN_VESTING.connect(this.alice).transferLockOwnership(0, this.bob.address)
    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(0, '10')).to.be.revertedWith('AMOUNT')
    await this.TOKEN_VESTING.connect(this.bob).withdraw(1, '961')
  }),
  it("Generate tokens", async function() {
    var largeNumber = (BigInt(10) ** BigInt(77)).toString()
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token2 = await ERC20Contract.deploy('Token 2', 'T2', largeNumber);
    await this.token2.waitForDeployment();
    await this.token2.transfer(this.alice.address, largeNumber)
  }),
  it("Test a lock Type 1 Again", async function() {
    await this.token1.connect(this.alice).approve(this.TOKEN_VESTING.target, '1000000');
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token1.target, [[this.alice.address, '1000000', '0', fiveMinsFromNow, ethers.ZeroAddress]])
  }),
  it("Multi Lock", async function() {
    var totalSupply = '1000'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 4', 'T4', totalSupply);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, totalSupply)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var lockParams = [
      [this.alice.address, '500', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '250', '0', fiveMinsFromNow, ethers.ZeroAddress],
      // [this.bob.address, '125', '0', fiveMinsFromNow, ethers.ZeroAddress],
      // [this.alice.address, '1', '0', fiveMinsFromNow, ethers.ZeroAddress],
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)
  })
  /* it("Large Lock", async function() {
    var largeNumber = hre.ethers.BigNumber.from(10).pow(77).toString()
    await this.token2.connect(this.alice).approve(this.TOKEN_VESTING.target, largeNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var lockParams = [[this.alice.address, largeNumber, '0', fiveMinsFromNow, ethers.ZeroAddress]]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token2.target, lockParams)
  }) */
  /* it("Tiny Lock", async function() {
    var tinyNumber = '100'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 3', 'T3', tinyNumber);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, tinyNumber)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, tinyNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var lockParams = [[this.alice.address, tinyNumber, '0', fiveMinsFromNow, ethers.ZeroAddress]]
    // this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)
  }) */
  /* it("Test Migration", async function() {
    var feeStruct = await this.TOKEN_VESTING.FEES()
    feeStruct = {
      tokenFee: feeStruct[0].toString(),
      feeAddress: feeStruct[1],
      freeLockingFee: feeStruct[2].toString(),
      freeLockingToken: feeStruct[3]
    }
    var aliceEthBalance = await this.alice.getBalance()
    await this.TOKEN_VESTING.connect(this.alice).payForFreeTokenLocks(this.token1.target, {value: feeStruct.freeLockingFee})
    expect(await this.alice.getBalance()).to.lt(aliceEthBalance.sub(feeStruct.freeLockingFee))
  }) */
});

