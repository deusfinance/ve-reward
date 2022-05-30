import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import {
  deployRewardStrategy,
  deployRewardStrategyV2,
  deployTokenTest,
} from "../scripts/deployHelpers";
import {
  RewardStrategy,
  RewardStrategyV2,
  VeDist,
  VeTest__factory,
} from "../typechain";
import { getCurrentTimeStamp, increaseTime } from "./timeUtils";

describe("RewardStrategyV2", () => {
  let mockVe: MockContract;
  let rewardStrategy: RewardStrategyV2;
  let me: SignerWithAddress;
  let user1: SignerWithAddress;
  let ve1 = BigNumber.from(1);
  let amount0 = BigNumber.from(1000);
  let amount1 = BigNumber.from(2000);
  let startWeek = BigNumber.from(1647475200);
  let week = BigNumber.from(7 * 86400);
  before(async () => {
    [me, user1] = await ethers.getSigners();
    mockVe = await deployMockContract(me, VeTest__factory.abi);
    rewardStrategy = await deployRewardStrategyV2(me.address, mockVe.address);
  });
  it("should set apr for three weeks", async () => {
    await rewardStrategy.connect(me).setAPR(amount0);
    let apr = await rewardStrategy.aprs(0);
    expect(apr).eq(amount0);
    await rewardStrategy.connect(me).setAPR(amount1);
    apr = await rewardStrategy.aprs(1);
    expect(apr).eq(amount1);
  });
  it("should revert if times is zero", async () => {
    let tx = rewardStrategy.getPendingReward(ve1, 0, 0);
    await expect(tx).to.be.revertedWith("RewardStrategyV2: TIMES_ZERO");
  });
  it("should return correct pending reward", async () => {
    let startTime = startWeek.add(86400 * 3.5);
    await mockVe.mock.locked__end.withArgs(ve1).returns(4 * 365 * 86400);
    await mockVe.mock.balanceOfNFTAt
      .withArgs(ve1, startTime)
      .returns(BigNumber.from(1000));
    await mockVe.mock.balanceOfNFTAt
      .withArgs(ve1, startWeek.add(week))
      .returns(BigNumber.from(2000));
    await mockVe.mock.balanceOfNFTAt
      .withArgs(ve1, startWeek.add(week.mul(2)))
      .returns(BigNumber.from(2000));
    await mockVe.mock.balanceOfNFTAt
      .withArgs(ve1, startWeek.add(week.mul(3)))
      .returns(BigNumber.from(2000));
    await mockVe.mock.balanceOfNFTAt
      .withArgs(ve1, startWeek.add(week.mul(4)))
      .returns(BigNumber.from(2000));
    let a = await rewardStrategy.getPendingReward(ve1, startTime, 5);
    expect(a[0]).eq(17);
  });
});
