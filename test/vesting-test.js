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
    const block = await hre.ethers.provider.getBlock("latest")
    console.log('TIME:', block.timestamp)
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
    await hre.ethers.provider.send("evm_mine")
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
  it("Large Lock", async function() {
    var largeNumber = (BigInt(10) ** BigInt(67)).toString()
    await this.token2.connect(this.alice).approve(this.TOKEN_VESTING.target, largeNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var lockParams = [[this.alice.address, largeNumber, '0', fiveMinsFromNow, ethers.ZeroAddress]]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token2.target, lockParams)
  })
  it("Tiny Lock", async function() {
    var tinyNumber = '100'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 3', 'T3', tinyNumber);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, tinyNumber)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, tinyNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var lockParams = [[this.alice.address, tinyNumber, '0', fiveMinsFromNow, ethers.ZeroAddress]]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)
  }),
  it("Multi Lock", async function() {
    var totalSupply = '1000'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 4', 'T4', totalSupply);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, totalSupply)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);

    await this.TOKEN_VESTING.editZeroFeeWhitelist(token.target, true)

    expect(await token.balanceOf(this.TOKEN_VESTING.target)).to.equal('0');

    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var nonce = Number(await this.TOKEN_VESTING.NONCE())
    var lockParams = [
      [this.alice.address, '500', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '250', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '125', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.alice.address, '100', '0', fiveMinsFromNow, ethers.ZeroAddress],
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)
    expect(await token.balanceOf(this.TOKEN_VESTING.target)).to.equal('975');
    
    var nonce2 = Number(await this.TOKEN_VESTING.NONCE())
    expect(nonce2).to.equal(nonce + lockParams.length)
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonce2 - 1)
    expect(lock.lockID).to.equal(nonce2 - 1)
    expect(lock.tokensDeposited).to.equal('100')
  }),
  it("Linear scaling locks", async function() {
    var tinyNumber = '100'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token L', 'TL', tinyNumber);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, tinyNumber)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, tinyNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;
    var lockParams = [[this.alice.address, tinyNumber, block.timestamp, fiveMinsFromNow, ethers.ZeroAddress]]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)

    var nonce = Number(await this.TOKEN_VESTING.NONCE())
    nonce--
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonce)

    var withdrawable = await this.TOKEN_VESTING.getWithdrawableShares(nonce)
    expect(withdrawable).to.equal(0)
    var duration = lock.endEmission - lock.startEmission
    expect(duration).to.equal(300)

    // advance timestamp 20% of the duration, expect to be able to withdraw 20% of the lock
    await hre.ethers.provider.send("evm_increaseTime", [duration / 5])
    await hre.ethers.provider.send("evm_mine")
    var withdrawable2 = await this.TOKEN_VESTING.getWithdrawableShares(nonce)
    expect(withdrawable2).to.equal(20)
    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(nonce, Number(withdrawable2) + 1)).to.be.revertedWith('AMOUNT')
    await this.TOKEN_VESTING.connect(this.alice).withdraw(nonce, Number(withdrawable2))
    
    // advance timestamp past full duration to withdraw full amount
    await hre.ethers.provider.send("evm_increaseTime", [duration])
    await hre.ethers.provider.send("evm_mine")
    var withdrawable3 = await this.TOKEN_VESTING.getWithdrawableShares(nonce)
    expect(withdrawable3).to.equal(80)
  }),
  it("Lock with startEmission >= endEmission", async function() {
    var tinyNumber = '100'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 3', 'T3', tinyNumber);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, tinyNumber)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, tinyNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var lockParams = [[this.alice.address, tinyNumber, block.timestamp , block.timestamp, ethers.ZeroAddress]]
    await expect(this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)).to.be.revertedWith('PERIOD')
  }),
  it("Conditional Lock with premature withdrawl", async function() {
    var tinyNumber = '100'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 3', 'T3', tinyNumber);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, tinyNumber)
    this.migratorToken = token

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, tinyNumber);
    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp + 300;

    const ConditionLight = await hre.ethers.getContractFactory("ConditionLight");
    var condition = await ConditionLight.deploy();
    var lockParams = [[this.alice.address, tinyNumber, 0 , fiveMinsFromNow, condition.target]]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)
    var nonce = Number(await this.TOKEN_VESTING.NONCE())
    nonce--

    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(nonce, 100)).to.be.revertedWith('AMOUNT')
    await condition.setCondition(true)
    await this.TOKEN_VESTING.connect(this.alice).withdraw(nonce, 10)
  }),
  it("Conditional Lock with failing condition and revoke withdrawl", async function() {
    var tinyNumber = '100'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    var token = await ERC20Contract.deploy('Token 3', 'T3', tinyNumber);
    await token.waitForDeployment();
    await token.transfer(this.alice.address, tinyNumber)

    await token.connect(this.alice).approve(this.TOKEN_VESTING.target, tinyNumber);

    const FailingCondition = await hre.ethers.getContractFactory("FailingCondition");
    var condition = await FailingCondition.deploy();
    var lockParams = [[this.alice.address, tinyNumber, 0 , 1, condition.target]]
    await this.TOKEN_VESTING.connect(this.alice).lock(token.target, lockParams)
    var nonce = Number(await this.TOKEN_VESTING.NONCE())
    nonce--

    await condition.setCondition(116) // some arbitrary number that returns a non bool value (e.g. not 1 or 0)
    await expect(this.TOKEN_VESTING.connect(this.alice).withdraw(nonce, 100)).to.be.reverted

    await this.TOKEN_VESTING.connect(this.alice).revokeCondition(nonce)
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonce)
    expect(lock.condition).to.equal(ethers.ZeroAddress)
    await this.TOKEN_VESTING.connect(this.alice).withdraw(nonce, 10)
  }),
  it("Test Migration", async function() {
    var preMigrationBalance = await this.migratorToken.balanceOf(this.TOKEN_VESTING.target)

    var nonce = Number(await this.TOKEN_VESTING.NONCE())
    nonce -= 2
    var lock = await LockModel.getLock(this.TOKEN_VESTING, nonce)
    expect(preMigrationBalance).to.equal(lock.tokensDeposited - lock.tokensWithdrawn)
    await expect(this.TOKEN_VESTING.connect(this.alice).migrate(0, 12)).to.be.revertedWith("NOT SET")

    const MigratorContract = await hre.ethers.getContractFactory("Migrator");
    const MIGRATOR = await MigratorContract.deploy();

    await this.TOKEN_VESTING.setMigrator(MIGRATOR.target)
    await this.TOKEN_VESTING.connect(this.alice).migrate(nonce, 12)

    var migratedLock = await MIGRATOR.LOCKS(0)
    migratedLock = {
      address: migratedLock[0],
      amountDeposited: migratedLock[1].toString(),
      amountWithdrawn: migratedLock[2].toString(),
      startEmission: Number(migratedLock[3]),
      endEmission: Number(migratedLock[4]),
      lockID: migratedLock[5].toString(),
      owner: migratedLock[6],
      condition: migratedLock[7],
      option: Number(migratedLock[8]),
    }

    expect(lock.address).to.equal(migratedLock.address)
    expect(lock.tokensDeposited).to.equal(migratedLock.amountDeposited)
    expect(lock.tokensWithdrawn).to.equal(migratedLock.amountWithdrawn)
    expect(lock.startEmission).to.equal(migratedLock.startEmission)
    expect(lock.endEmission).to.equal(migratedLock.endEmission)
    expect(lock.owner).to.equal(migratedLock.owner)
    expect(lock.condition).to.equal(migratedLock.condition)
    expect(migratedLock.option).to.equal(12)

    var postMigrationBalance = await this.migratorToken.balanceOf(this.TOKEN_VESTING.target)
    expect(postMigrationBalance).to.equal(0)

    var migratorBalance = await this.migratorToken.balanceOf(MIGRATOR.target)
    expect(migratorBalance).to.equal(preMigrationBalance)
  })
  /* it("Test Migration", async function() {
    var feeStruct = await this.TOKEN_VESTING.FEES()
    feeStruct = {
      tokenFee: feeStruct[0].toString(),
      feeAddress: feeStruct[1],
      freeLockingFee: feeStruct[2].toString(),
      freeLockingToken: feeStruct[3]
    }
    var aliceEthBalance = await this.alice.getBalance()
    await this.TOKEN_VESTING.connect(this.alice).payForFreeTokenLocks(this.token1.address, {value: feeStruct.freeLockingFee})
    expect(await this.alice.getBalance()).to.lt(aliceEthBalance.sub(feeStruct.freeLockingFee))
  }) */
});

