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
    /* const ERC20Contract = await hre.ethers.getContractFactory("ERC20Mock");
    this.token1 = await ERC20Contract.deploy('Token 1', 'T1', '10000000');
    await this.token1.waitForDeployment(); */

    /* const BombContract = await hre.ethers.getContractFactory("BOMBv3");
    this.token1 = await BombContract.deploy();
    await this.token1.waitForDeployment(); */

    const Base2Contract = await hre.ethers.getContractFactory("Base2");
    this.token1 = await Base2Contract.deploy();
    await this.token1.waitForDeployment();
    await this.token1.setPricer(this.main_account.address)
    var ts = await this.token1.totalSupply()

    var totalSupply = await this.token1.totalSupply()
    await this.token1.transfer(this.alice.address, totalSupply)
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
  it("Test a lock Type 1 for alice with fee to fee address", async function() {
    await this.token1.connect(this.alice).approve(this.TOKEN_VESTING.target, '100000000000');
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token1.target, [[this.alice.address, '100', '0', 2, ethers.ZeroAddress]])
  }),
  it("Test a lock Type 1 for alice with fee to fee address", async function() {
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token1.target, [[this.alice.address, '100', '0', 2, ethers.ZeroAddress]])
  })
  it("Test a lock Type 1 for alice with fee to fee address", async function() {
    await this.token1.rebase(-500)
    await this.TOKEN_VESTING.connect(this.alice).lock(this.token1.target, [[this.alice.address, '100', '0', 2, ethers.ZeroAddress]])
  })
});

