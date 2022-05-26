import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployTokenTest, deployVeDist } from "../scripts/deployHelpers";
import {
  RewardStrategy,
  RewardStrategy__factory,
  VeDist,
  VeTest,
  VeTest__factory,
} from "../typechain";
import {
  getActivePeriod,
  getCurrentTimeStamp,
  increaseTime,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";

describe("VeDist", () => {
  let veDist: VeDist;
  let mockRewardStrategy: MockContract;
  let mockVe: MockContract;

  let me: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let ve1: BigNumber = BigNumber.from(1);
  let ve2: BigNumber = BigNumber.from(2);

  let user1LastClaimPeriod: BigNumber = BigNumber.from(0);
  let user2LastClaimPeriod: BigNumber = BigNumber.from(0);

  let week = 86400 * 7;

  before(async () => {
    [me, user1, user2] = await ethers.getSigners();
    mockRewardStrategy = await deployMockContract(
      me,
      RewardStrategy__factory.abi
    );
    mockVe = await deployMockContract(me, VeTest__factory.abi);
    veDist = await deployVeDist(mockRewardStrategy.address, mockVe.address);

    await mockVe.mock.deposit_for.returns();
  });
  it("should get latest claim period", async () => {
    let activePeriod = await getActivePeriod();
    let _latestPeriod = activePeriod - week;
    let latestPeriod = await veDist.getLatestPeriod();
    expect(latestPeriod).to.eq(_latestPeriod);
  });
  it("should return users last claim period", async () => {
    await setTimeToNextThursdayMidnight();
    let claimPeriod = await getActivePeriod();
    await mockVe.mock.isApprovedOrOwner
      .withArgs(user1.address, ve1)
      .returns(true);
    await veDist.connect(user1).claim(ve1);
    await setTimeToNextThursdayMidnight();
    let lastClaimPeriod = await veDist.lastClaimPeriod(ve1);
    user1LastClaimPeriod = lastClaimPeriod;
    expect(claimPeriod).to.eq(await veDist.getLatestPeriod());
    expect(claimPeriod).to.eq(lastClaimPeriod);
  });
  it("when claimed before", async () => {
    // this means user 1 missed two claim periods
    await setTimeToNextThursdayMidnight();
    let p1 = await veDist.getLatestPeriod();
    await setTimeToNextThursdayMidnight();
    let p2 = await veDist.getLatestPeriod();

    let pendingPeriods = await veDist.getPendingRewardPeriods(ve1);

    expect(pendingPeriods.length).eq(2);
    expect(p1.sub(week)).eq(user1LastClaimPeriod);
    expect(p1).eq(pendingPeriods[0]);
    expect(p2).eq(pendingPeriods[1]);
  });

  it("should return unclaimed reward at period", async () => {
    let latestPeriod = await veDist.getLatestPeriod();
    await mockRewardStrategy.mock.getRewardAmount
      .withArgs(latestPeriod.sub(week), latestPeriod)
      .returns(BigNumber.from(1000));
    await mockVe.mock.balanceOfNFTAt
      .withArgs(ve1, latestPeriod)
      .returns(BigNumber.from(10));
    await mockVe.mock.totalSupplyAtT
      .withArgs(latestPeriod)
      .returns(BigNumber.from(100));

    let share = await veDist.getShareAt(ve1, latestPeriod);
    expect(share).eq(BigNumber.from(100));
  });
  it("should return correct unclaimed periods length", async () => {
    let startPeriod = await veDist.startPeriod();
    let latestPeriod = await veDist.getLatestPeriod();
    let pendingPeriodsLength = BigNumber.from(latestPeriod)
      .sub(startPeriod)
      .div(week);
    let pendingPeriods = await veDist.getPendingRewardPeriods(ve2);
    expect(pendingPeriods.length).eq(pendingPeriodsLength);
  });
  it("should fail to claim if not owner or approved", async () => {
    await mockVe.mock.isApprovedOrOwner
      .withArgs(user1.address, ve2)
      .returns(false);
    let claim = veDist.connect(user1).claim(ve2);
    await expect(claim).to.be.revertedWith("VeDist: NOT_APPROVED");
  });
  it("should get correct reward amount", async () => {
    // there are three pending periods for ve2
    await mockRewardStrategy.mock.getRewardAmount.returns(BigNumber.from(1000));
    await mockVe.mock.balanceOfNFTAt.returns(BigNumber.from(20));
    await mockVe.mock.totalSupplyAtT.returns(BigNumber.from(100));
    let pendingRewards = await veDist.getPendingRewardsTimes(ve2, 3);
    expect(pendingRewards).eq(600);
  });
  // it("should claim", async () => {
  //   // there are three pending periods for ve2
  //   await mockVe.mock.isApprovedOrOwner
  //     .withArgs(user2.address, ve2)
  //     .returns(true);
  //   await mockRewardStrategy.mock.getRewardAmount.returns(BigNumber.from(1000));
  //   await mockVe.mock.balanceOfNFTAt.returns(BigNumber.from(20));
  //   await mockVe.mock.totalSupplyAtT.returns(BigNumber.from(100));
  //   await veDist.connect(user2).claim(ve2);
  // });
});
