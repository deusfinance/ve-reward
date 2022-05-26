import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployTokenTest } from "../scripts/deployHelpers";
import { RewardStrategy, VeDist } from "../typechain";
import {
  getActivePeriod,
  getCurrentTimeStamp,
  increaseTime,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";

describe("RewardStrategy", () => {
  let rewardStrategy: RewardStrategy;
  let me: SignerWithAddress;
  before(async () => {
    [me] = await ethers.getSigners();
  });
  it("should deploy VeDist", async () => {
    let rewardStrategyFactory = await ethers.getContractFactory(
      "RewardStrategy"
    );
    rewardStrategy = await rewardStrategyFactory.deploy();
    await rewardStrategy.deployed();
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
});
