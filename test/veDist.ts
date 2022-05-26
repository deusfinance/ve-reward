import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployTokenTest, deployVeDist } from "../scripts/deployHelpers";
import { RewardStrategy, RewardStrategy__factory, VeDist } from "../typechain";
import {
  getActivePeriod,
  getCurrentTimeStamp,
  increaseTime,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";

describe("VeDist", () => {
  let veDist: VeDist;
  let mockRewardStrategy: MockContract;
  let me: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let user1LastClaimPeriod: BigNumber = BigNumber.from(0);
  let user2LastClaimPeriod: BigNumber = BigNumber.from(0);

  let week = 86400 * 7;

  before(async () => {
    [me, user1, user2] = await ethers.getSigners();
    mockRewardStrategy = await deployMockContract(
      me,
      RewardStrategy__factory.abi
    );
    veDist = await deployVeDist(mockRewardStrategy.address);
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
    await veDist.connect(user1).claim();
    await setTimeToNextThursdayMidnight();
    let lastClaimPeriod = await veDist.lastClaimPeriod(user1.address);
    user1LastClaimPeriod = lastClaimPeriod;
    expect(claimPeriod).to.eq(await veDist.getLatestPeriod());
    expect(claimPeriod).to.eq(lastClaimPeriod);
  });
  describe("Pending Periods", async () => {
    it("when claimed before", async () => {
      // this means user 1 missed two claim periods
      await setTimeToNextThursdayMidnight();
      let p1 = await veDist.getLatestPeriod();
      await setTimeToNextThursdayMidnight();
      let p2 = await veDist.getLatestPeriod();

      let pendingPeriods = await veDist.getPendingRewardPeriods(user1.address);

      expect(pendingPeriods.length).eq(2);
      expect(p1.sub(week)).eq(user1LastClaimPeriod);
      expect(p1).eq(pendingPeriods[0]);
      expect(p2).eq(pendingPeriods[1]);
    });
    // it("when last claim period is 0", async () => {
    //   let rewardPoints = [
    //     [
    //       (await getCurrentTimeStamp()) - week, // timestamp
    //       BigNumber.from(1000), // amount
    //     ],
    //     [
    //       (await getCurrentTimeStamp()) - 1000, // timestamp
    //       BigNumber.from(1500), // amount
    //     ],
    //   ];
    //   await mockRewardStrategy.mock.getRewardPointsBetweenTimestamps.returns(
    //     rewardPoints
    //   );
    //   let pendingRwardPoints = await veDist.getPendingRewardPoints(
    //     user2.address
    //   );
    //   expect(pendingRwardPoints[0][1]).eq(rewardPoints[0][1]);
    //   expect(pendingRwardPoints[1][1]).eq(rewardPoints[1][1]);
    // });
  });
});
