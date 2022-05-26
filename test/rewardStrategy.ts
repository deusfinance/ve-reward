import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import {
  deployRewardStrategy,
  deployTokenTest,
} from "../scripts/deployHelpers";
import { RewardStrategy, VeDist } from "../typechain";
import { getCurrentTimeStamp, increaseTime } from "./timeUtils";

describe("RewardStrategy", () => {
  let rewardStrategy: RewardStrategy;
  let me: SignerWithAddress;
  before(async () => {
    [me] = await ethers.getSigners();
    rewardStrategy = await deployRewardStrategy(me.address);
  });
  it("reward should be zero", async () => {
    let latestRewardPerBlock = await rewardStrategy.getLatestRewardPerBlock();
    expect(latestRewardPerBlock).to.eq(BigNumber.from(0)); // epoch 0
  });
  it("should change reward per block to 1000", async () => {
    await increaseTime(1000);
    await rewardStrategy.setRewardPerBlock(BigNumber.from(1000));
    let latestRewardPerBlock = await rewardStrategy.getLatestRewardPerBlock();
    expect(latestRewardPerBlock).to.eq(BigNumber.from(1000)); // epoch 1
  });
  it("should return epoch 0", async () => {
    let timestamp = await getCurrentTimeStamp();
    timestamp -= 10;
    let epoch = await rewardStrategy.getEpoch(timestamp);
    expect(epoch).to.eq(BigNumber.from(0));
  });
  it("should return epoch 1", async () => {
    let timestamp = await getCurrentTimeStamp();
    timestamp += 10;
    let epoch = await rewardStrategy.getEpoch(timestamp);
    expect(epoch).to.eq(BigNumber.from(1));
  });
  it("should return correct epoch from timestamp", async () => {
    await increaseTime(1000);
    await rewardStrategy.setRewardPerBlock(BigNumber.from(500)); // epoch 2
    let timestamp = await getCurrentTimeStamp();
    timestamp -= 10;
    let epoch = await rewardStrategy.getEpoch(BigNumber.from(timestamp));
    expect(epoch).to.eq(BigNumber.from(1));
  });
  it("should still return the correct epoch", async () => {
    await increaseTime(1000);
    await rewardStrategy.setRewardPerBlock(BigNumber.from(1500)); // epoch 3
    await increaseTime(1000);
    await rewardStrategy.setRewardPerBlock(BigNumber.from(2500)); // epoch 4
    let timestamp = await getCurrentTimeStamp();
    timestamp -= 1010;
    let epoch = await rewardStrategy.getEpoch(BigNumber.from(timestamp));
    expect(epoch).to.eq(BigNumber.from(2));
  });
  it("should return correct reward per block based on timestamp", async () => {
    let currentTimestamp = await getCurrentTimeStamp();
    let rpb = await rewardStrategy.getRewardPerBlockAtTimestamp(
      currentTimestamp
    );
    expect(rpb).eq(BigNumber.from(2500)); // epoch 4
  });
  it("should return reward points between two timestamps", async () => {
    let endTimestamp = await getCurrentTimeStamp();
    let startTimestamp = endTimestamp - 1000;
    let rewardPoints = await rewardStrategy.getRewardPointsBetweenTimestamps(
      startTimestamp,
      endTimestamp
    );
    expect(rewardPoints[0].amount).to.eq(1500); // epoch 3
    expect(rewardPoints[1].amount).to.eq(2500); // epoch 4
  });
});
