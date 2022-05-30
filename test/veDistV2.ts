import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployVeDistV2 } from "../scripts/deployHelpers";
import {
  IDEUS__factory,
  IRewardStrategyV2__factory,
  VeDistV2,
  VeTest__factory,
} from "../typechain";
import { getCurrentTimeStamp } from "./timeUtils";

describe("VeDistV2", () => {
  let veDist: VeDistV2;
  let me: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let ve1: BigNumber = BigNumber.from(1);
  let ve2: BigNumber = BigNumber.from(2);
  let mockVe: MockContract;
  let mockDeus: MockContract;
  let mockRewardStrategy: MockContract;

  let user1LastClaimPeriod: BigNumber = BigNumber.from(0);
  let user2LastClaimPeriod: BigNumber = BigNumber.from(0);

  let week = 86400 * 7;

  before(async () => {
    [me, user1, user2] = await ethers.getSigners();
    mockVe = await deployMockContract(me, VeTest__factory.abi);
    mockDeus = await deployMockContract(me, IDEUS__factory.abi);
    mockRewardStrategy = await deployMockContract(
      me,
      IRewardStrategyV2__factory.abi
    );
    veDist = await deployVeDistV2(
      mockVe.address,
      mockRewardStrategy.address,
      mockDeus.address
    );
    await mockDeus.mock.approve.returns(true);
    await mockDeus.mock.mint.returns();
    await mockVe.mock.deposit_for.returns();
  });
  it("should return correct lastClaimTimestamp", async () => {
    let currentTimeStamp = await getCurrentTimeStamp();
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(currentTimeStamp));
    let lastClaim = await veDist.getLastClaimTimestamp(ve1);
    expect(currentTimeStamp).eq(lastClaim);
  });
  it("should claim", async () => {
    let epoch = BigNumber.from(1000);
    let reward = BigNumber.from(2000);
    let startTime = await veDist.getLastClaimTimestamp(ve1);
    let currentTimeStamp = await getCurrentTimeStamp();
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(currentTimeStamp));
    await mockVe.mock.isApprovedOrOwner.returns(true);
    await mockRewardStrategy.mock.getPendingReward.returns([reward, epoch]);
    await mockRewardStrategy.mock.aprsLength.returns(BigNumber.from(2));
    await mockRewardStrategy.mock.getPendingStartIndex
      .withArgs(startTime)
      .returns(BigNumber.from(0));
    await veDist.connect(user1).claim(ve1);
    let lastClaim = await veDist.getLastClaimTimestamp(ve1);
    let rewardBalance = await veDist.rewardBalance(ve1);
    expect(lastClaim).eq(epoch);
    expect(rewardBalance).eq(reward);
  });
});
