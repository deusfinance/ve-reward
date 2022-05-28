import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployTokenTest, deployVeDistV2 } from "../scripts/deployHelpers";
import {
  IDEUS__factory,
  RewardStrategy,
  RewardStrategyV2__factory,
  RewardStrategy__factory,
  Utils__factory,
  VeDist,
  VeDistV2,
  VeTest,
  VeTest__factory,
} from "../typechain";
import {
  getActivePeriod,
  getCurrentBlock,
  getCurrentTimeStamp,
  increaseTime,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";

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
      RewardStrategyV2__factory.abi
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
    let currentTimeStamp = await getCurrentTimeStamp();
    await increaseTime(365 * 86400);
    await mockRewardStrategy.mock.getApr
      .withArgs(ve1)
      .returns(BigNumber.from(1000000));
    await mockVe.mock.locked
      .withArgs(ve1)
      .returns([BigNumber.from(1000), BigNumber.from(2 * 365 * 86400)]);
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(currentTimeStamp));
    let reward = await veDist.getRewardAmount(ve1);
    expect(reward).eq(BigNumber.from(1000));
    await veDist.connect(user1).claim(ve1);
    reward = await veDist.getRewardAmount(ve1);
    expect(reward).eq(BigNumber.from(0));
  });
});
