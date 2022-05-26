import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { RewardStrategy, TokenTest } from "../typechain";

async function deployTokenTest(): Promise<TokenTest> {
  let tokenFactory = await ethers.getContractFactory("TokenTest");
  let token = await tokenFactory.deploy();
  await token.deployed();
  return token;
}

async function deployRewardStrategy(admin: string): Promise<RewardStrategy> {
  let rewardStrategyFactory = await ethers.getContractFactory("RewardStrategy");
  let rewardStrategy = await rewardStrategyFactory.deploy(admin);
  await rewardStrategy.deployed();
  return rewardStrategy;
}

export { deployTokenTest, deployRewardStrategy };
