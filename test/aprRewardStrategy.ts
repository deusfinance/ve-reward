import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployRewardStrategyV2 } from "../scripts/deployHelpers";
import { RewardStrategyV2, VeTest__factory } from "../typechain";

describe("APRReward", async () => {
  let aprStrategy: RewardStrategyV2;
  let veMock: MockContract;
  let ve1: BigNumber = BigNumber.from(1);
  let me: SignerWithAddress;
  let user: SignerWithAddress;
  let maxApr: BigNumber = BigNumber.from(2e6);
  before(async () => {
    [me, user] = await ethers.getSigners();
    veMock = await deployMockContract(me, VeTest__factory.abi);
    aprStrategy = await deployRewardStrategyV2(
      BigNumber.from(1e6),
      veMock.address,
      me.address
    );
  });
  it("should validate initial state", async () => {
    let maxApr_ = await aprStrategy.maxApr();
    expect(maxApr_).eq(1e6);
  });
  it("non-setter role cannot set apr", async () => {
    let setApr = aprStrategy.connect(user).setParams(maxApr, veMock.address);
    await expect(setApr).to.be.reverted;
  });
  it("should update params if user has setter role", async () => {
    await aprStrategy.setParams(maxApr, veMock.address);
    let maxApr_ = await aprStrategy.maxApr();
    expect(maxApr).eq(maxApr_);
  });
  it("it should return users apr", async () => {
    await veMock.mock.locked__end
      .withArgs(ve1)
      .returns(BigNumber.from(2 * 365 * 86400));
    let apr = await aprStrategy.getApr(ve1);
    expect(apr).eq(BigNumber.from(1e6));
  });
});
