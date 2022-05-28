import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployRewardStrategyV2 } from "../scripts/deployHelpers";
import { RewardStrategyV2 } from "../typechain";

describe("APRReward", async () => {
  let aprStrategy: RewardStrategyV2;
  let me: SignerWithAddress;
  let user: SignerWithAddress;
  let maxApr: BigNumber = BigNumber.from(2e6);
  before(async () => {
    [me, user] = await ethers.getSigners();
    aprStrategy = await deployRewardStrategyV2(BigNumber.from(1e6), me.address);
  });
  it("should validate initial state", async () => {
    let maxApr_ = await aprStrategy.maxApr();
    expect(maxApr_).eq(1e6);
  });
  it("non-setter role cannot set apr", async () => {
    let setApr = aprStrategy.connect(user).setParams(maxApr);
    await expect(setApr).to.be.reverted;
  });
  it("should update params if user has setter role", async () => {
    await aprStrategy.setParams(maxApr);
    let maxApr_ = await aprStrategy.maxApr();
    expect(maxApr).eq(maxApr_);
  });
  it("it should return users apr", async () => {});
});
