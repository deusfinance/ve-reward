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
  it("should reward be zero", async () => {
    let latestRewardPerBlock = await rewardStrategy.getLatestRewardPerBlock();
    expect(latestRewardPerBlock).to.eq(BigNumber.from(0)); // epoch 0
  });
  it("should change reward per block to 1000", async () => {
    await increaseTime(1000);
    await rewardStrategy.setRewardPerBlock(BigNumber.from(1000));
    let latestRewardPerBlock = await rewardStrategy.getLatestRewardPerBlock();
    expect(latestRewardPerBlock).to.eq(BigNumber.from(1000)); // epoch 1
  });
  it("should return correct epoch if only two points", async () => {
    let timestamp = await getCurrentTimeStamp();
    timestamp -= 10;
    let epoch = await rewardStrategy.getEpoch(timestamp);
    expect(epoch).to.eq(BigNumber.from(0));
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
  // it("should return correct reward per block between two timestamps", async () => {
  //   await increaseTime(1000);
  //   let startTimeStamp = await getCurrentTimeStamp();
  //   await rewardStrategy.setRewardPerBlock(BigNumber.from(1500));
  //   await increaseTime(200);
  //   await rewardStrategy.setRewardPerBlock(BigNumber.from(2000));
  //   await increaseTime(700); // 1000 incresed by now
  //   let endTimeStamp = await getCurrentTimeStamp();
  //   // between startTimeStamp and end timeStamp, there are two points, 1500 and 2000
  //   let points = await rewardStrategy.getRewardPoints(
  //     startTimeStamp,
  //     endTimeStamp
  //   );
  // });
});
