import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployVeDistV2 } from "../scripts/deployHelpers";
import {
  IDEUS__factory,
  IERC20__factory,
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
  let ve3: BigNumber = BigNumber.from(3);
  let mockVe: MockContract;
  let mockDeus: MockContract;
  let mockRewardStrategy: MockContract;
  let week = 86400 * 7;

  before(async () => {
    [me, user1, user2] = await ethers.getSigners();
    mockVe = await deployMockContract(me, VeTest__factory.abi);
    mockDeus = await deployMockContract(me, IERC20__factory.abi);
    mockRewardStrategy = await deployMockContract(
      me,
      IRewardStrategyV2__factory.abi
    );
    veDist = await deployVeDistV2(
      me.address,
      mockVe.address,
      mockRewardStrategy.address,
      mockDeus.address
    );
    await mockDeus.mock.allowance.returns(BigNumber.from(0));
    await mockDeus.mock.approve.returns(true);
    await mockDeus.mock.transfer.returns(true);
    await mockVe.mock.deposit_for.returns();
  });
  it("should return correct lastClaimTimestamp", async () => {
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(1648080000));
    let lastClaim = await veDist.getLastClaimTimestamp(ve1);
    expect(lastClaim).eq(BigNumber.from(1648080000));
  });
  it("should return correct pending reward length", async () => {
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(1648080000));
    await mockRewardStrategy.mock.aprsLength.returns(2);
    await mockRewardStrategy.mock.getPendingStartIndex
      .withArgs(BigNumber.from(1648080000))
      .returns(BigNumber.from(0));

    let pendingRewardsLength = await veDist.getPendingRewardsLength(ve1);
    expect(pendingRewardsLength).eq(2);
  });
  it("should return correct pending reward", async () => {
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(1648080000));
    await mockRewardStrategy.mock.aprsLength.returns(BigNumber.from(2));
    await mockRewardStrategy.mock.getPendingStartIndex
      .withArgs(BigNumber.from(1648080000))
      .returns(BigNumber.from(0));
    await mockRewardStrategy.mock.getPendingReward
      .withArgs(ve1, BigNumber.from(1648080000), BigNumber.from(2))
      .returns(BigNumber.from(5000), BigNumber.from(1649289600));
    let pendingReward = await veDist.getPendingReward(ve1);
    expect(pendingReward).eq(BigNumber.from(5000));
  });
  it("should claim", async () => {
    await mockVe.mock.isApprovedOrOwner.returns(true);
    await mockVe.mock.user_point_history__ts
      .withArgs(ve1, 1)
      .returns(BigNumber.from(1648080000));
    await mockRewardStrategy.mock.aprsLength.returns(BigNumber.from(2));
    await mockRewardStrategy.mock.getPendingStartIndex
      .withArgs(BigNumber.from(1648080000))
      .returns(BigNumber.from(0));
    await mockRewardStrategy.mock.getPendingReward
      .withArgs(ve1, BigNumber.from(1648080000), BigNumber.from(2))
      .returns(BigNumber.from(5000), BigNumber.from(1649289600));
    await veDist.claim(ve1);
    let lastClaim = await veDist.getLastClaimTimestamp(ve1);
    expect(lastClaim).eq(BigNumber.from(1649289600));
  });
  it("should set reward strategy", async () => {
    await veDist.setRewardStrategy(
      "0x0000000000000000000000000000000000000000"
    );
    let rewardStrategy: string = await veDist.rewardStrategy();
    expect(rewardStrategy).eq("0x0000000000000000000000000000000000000000");
    await veDist.setRewardStrategy(mockRewardStrategy.address);
    rewardStrategy = await veDist.rewardStrategy();
    expect(rewardStrategy).eq(mockRewardStrategy.address);
  });
  it("should withdraw erc20", async () => {
    await veDist.withdrawERC20(mockDeus.address, me.address, BigNumber.from(0));
  });
  it("Should claim all", async () => {
    let tokens = [ve2, ve3];
    await mockVe.mock.isApprovedOrOwner.returns(true);
    await mockRewardStrategy.mock.aprsLength.returns(BigNumber.from(2));
    mockRewardStrategy.mock.getPendingStartIndex
      .withArgs(BigNumber.from(1648080000))
      .returns(BigNumber.from(0));
    for (let index = 0; index < tokens.length; index++) {
      let element = tokens[index];
      await mockVe.mock.user_point_history__ts
        .withArgs(element, 1)
        .returns(BigNumber.from(1648080000));
      await mockRewardStrategy.mock.getPendingReward
        .withArgs(element, BigNumber.from(1648080000), BigNumber.from(2))
        .returns(BigNumber.from(5000), BigNumber.from(1649289600));
    }
    await veDist.claimAll(tokens);
    for (let index = 0; index < tokens.length; index++) {
      let element = tokens[index];
      let lastClaim = await veDist.getLastClaimTimestamp(element);
      expect(lastClaim).eq(BigNumber.from(1649289600));
    }
  });
});
