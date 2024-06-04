// const { ethers } = require("hardhat")

const Self = {
  getLock: async (vestingContract, lockID) => {
    var lock = await vestingContract.getLock(lockID)
    return {
      lockID: Number(lock[0]),
      address: lock[1],
      tokensDeposited: lock[2].toString(),
      tokensWithdrawn: lock[3].toString(),
      sharesDeposited: lock[4].toString(),
      sharesWithdrawn: lock[5].toString(),
      startEmission: Number(lock[6]),
      endEmission: Number(lock[7]),
      owner: lock[8],
      condition: lock[9]
    }
  },
  getFees: async (vestingContract) => {
    var feeStruct = await vestingContract.FEES()
    return {
      tokenFee: feeStruct[0].toString(),
      freeLockingFee: feeStruct[1].toString(),
      feeAddress: feeStruct[2],
      freeLockingToken: feeStruct[3]
    }
  }
}

module.exports = Self