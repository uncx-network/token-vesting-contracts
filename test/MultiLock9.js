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
  it("Should test a Multi Lock which results in dust tokens being stuck", async function() {
    var totalSupply = '1000000000000000000000'
    const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token = await ERC20Contract.deploy('Token 4', 'T4', totalSupply);
    await this.token.waitForDeployment();
    await this.token.transfer(this.alice.address, totalSupply)

    await this.token.connect(this.alice).approve(this.TOKEN_VESTING.target, totalSupply);

    const block = await hre.ethers.provider.getBlock("latest")
    var fiveMinsFromNow = block.timestamp;
    var lockParams = [
      [this.alice.address, '10035122930255895634', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '10035122930255895634', '0', fiveMinsFromNow, ethers.ZeroAddress],
      [this.bob.address, '10035122930255895634', '0', fiveMinsFromNow, ethers.ZeroAddress],
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token.target, lockParams)
  }),
  it("Should test withdrawl with no stuck dust tokens", async function() {
    await this.TOKEN_VESTING.connect(this.alice).withdraw(0, '9999999999999999999')
    var lock = await LockModel.getLock(this.TOKEN_VESTING, 0)
    expect(lock.tokensWithdrawn).to.equal('9999999999999999999')
  }),
  it("Should test a small lock of 200 units", async function() {
    var lockParams = [
      [this.alice.address, '200', '0', 10, ethers.ZeroAddress],
    ]
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token.target, lockParams)
    await this.TOKEN_VESTING.connect(this.alice).withdraw(3, '3')
  })
});

