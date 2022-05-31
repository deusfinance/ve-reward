import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployRewardStrategyV2 } from "../scripts/deployHelpers";
import { RewardStrategyV2, VeTest__factory } from "../typechain";
import { getCurrentTimeStamp, increaseTime } from "./timeUtils";

describe("RewardStrategyV2", () => {
  let mockVe: MockContract;
  let rewardStrategy: RewardStrategyV2;
  let me: SignerWithAddress;
  let user1: SignerWithAddress;
  let ve1 = BigNumber.from(1);
  let vePower0: BigNumber = BigNumber.from(1000);
  let vePower1: BigNumber = BigNumber.from(2000);
  let vePower2: BigNumber = BigNumber.from(3000);

  let amount0 = BigNumber.from(1000000000);
  let amount1 = BigNumber.from(2000000000);
  let amount2 = BigNumber.from(500000000);
  let amount3 = BigNumber.from(2500000000);
  let startWeek = BigNumber.from(1648080000);
  let week = BigNumber.from(7 * 86400);
  before(async () => {
    [me, user1] = await ethers.getSigners();
    mockVe = await deployMockContract(me, VeTest__factory.abi);
    rewardStrategy = await deployRewardStrategyV2(me.address, mockVe.address);
  });
  it("should not allow non-setter role to set apr", async () => {
    let tx = rewardStrategy.connect(user1).setAPR(amount0);
    await expect(tx).to.be.reverted;
  });
  it("should allow setter role to set week", async () => {
    await rewardStrategy.setAPR(amount0);
    let aprLength = await rewardStrategy.aprsLength();
    let apr = await rewardStrategy.aprs(0);
    expect(aprLength).eq(1);
    expect(apr).eq(amount0); // week 0 apr
  });
  it("should set week 1,2 and 3 aprs", async () => {
    await rewardStrategy.setAPR(amount1);
    await rewardStrategy.setAPR(amount2);
    await rewardStrategy.setAPR(amount3);
    let aprsLength = await rewardStrategy.aprsLength();
    let apr1 = await rewardStrategy.aprs(1);
    let apr2 = await rewardStrategy.aprs(2);
    let apr3 = await rewardStrategy.aprs(3);

    expect(aprsLength).eq(4);
    expect(apr1).eq(amount1);
    expect(apr2).eq(amount2);
    expect(apr3).eq(amount3);
  });
  it("should revert if pendingReward called with times <= 0 ", async () => {
    let tx = rewardStrategy.getPendingReward(ve1, startWeek, 0);
    await expect(tx).to.be.revertedWith("RewardStrategyV2: TIMES_ZERO");
  });
  it("should return correct pending start index if locked before start week", async () => {
    let startIndex = await rewardStrategy.getPendingStartIndex(
      startWeek.sub(1000)
    );
    expect(startIndex).eq(0);
  });
  it("should return correct startIndex for timestamp = startweek", async () => {
    let startIndex = await rewardStrategy.getPendingStartIndex(startWeek);
    expect(startIndex).eq(1);
  });
  it("should return correct startIndex for timestamp after week 0 and before week 1", async () => {
    let startIndex = await rewardStrategy.getPendingStartIndex(
      startWeek.add(1000)
    );
    expect(startIndex).eq(1);
  });
  it("should return correct startIndex for timestamp > week 2", async () => {
    let startIndex = await rewardStrategy.getPendingStartIndex(
      startWeek.add(week.mul(2))
    );
    expect(startIndex).eq(3);
  });
  it("should return correct pending reward for locked time before start week", async () => {
    let lockTime = startWeek.sub(week.div(2));
    let correctReward = startWeek
      .sub(lockTime)
      .mul(amount0)
      .mul(vePower0)
      .div(week);
    await mockVe.mock.balanceOfNFTAt.withArgs(ve1, lockTime).returns(vePower0);
    let pendingReward = await rewardStrategy.getPendingReward(ve1, lockTime, 1);
    expect(pendingReward[0]).eq(correctReward);
    expect(pendingReward[1]).eq(startWeek);
  });
  it("should return correct pending reward if started after startweek", async () => {
    let lockTime = startWeek.add(week.div(2));
    let correctReward = startWeek
      .add(week)
      .sub(lockTime)
      .mul(amount1)
      .mul(vePower1)
      .div(week);
    await mockVe.mock.balanceOfNFTAt.withArgs(ve1, lockTime).returns(vePower1);
    let pendingReward = await rewardStrategy.getPendingReward(ve1, lockTime, 1);
    expect(pendingReward[0]).eq(correctReward);
    expect(pendingReward[1]).eq(startWeek.add(week));
  });
  it("should return correct pending reward for three times claim if locked before startWeek", async () => {
    let lockTime = startWeek.sub(week.div(2));
    let week0Time = startWeek;
    let week1Time = startWeek.add(week);
    let week2Time = week1Time.add(week);
    await mockVe.mock.balanceOfNFTAt.withArgs(ve1, lockTime).returns(vePower0); // power before week 0
    await mockVe.mock.balanceOfNFTAt.withArgs(ve1, week0Time).returns(vePower1); // power at week 0
    await mockVe.mock.balanceOfNFTAt.withArgs(ve1, week1Time).returns(vePower2); // power at week 1

    let correctRewardWeekBefore0 = amount0.mul(vePower0).div(2);
    let correctRewardWeek0 = amount1.mul(vePower1);
    let correctRewardWeek1 = amount2.mul(vePower2);
    let totalReward = correctRewardWeekBefore0
      .add(correctRewardWeek0)
      .add(correctRewardWeek1);
    let pendingReward = await rewardStrategy.getPendingReward(ve1, lockTime, 3);
    expect(totalReward).eq(pendingReward[0]);
    expect(week2Time).eq(pendingReward[1]);
  });
});
