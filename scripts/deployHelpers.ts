import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import {
  RewardStrategy,
  TokenTest,
  VeDist,
  Utils,
  RewardStrategyV2,
} from "../typechain";

async function deployTokenTest(): Promise<TokenTest> {
  let tokenFactory = await ethers.getContractFactory("TokenTest");
  let token = await tokenFactory.deploy();
  await token.deployed();
  return token;
}

async function deployUtils(admin: string): Promise<Utils> {
  let utilsFactory = await ethers.getContractFactory("Utils");
  let utils = await utilsFactory.deploy(admin);
  await utils.deployed();
  return utils;
}

async function deployRewardStrategy(admin: string): Promise<RewardStrategy> {
  let rewardStrategyFactory = await ethers.getContractFactory("RewardStrategy");
  let rewardStrategy = await rewardStrategyFactory.deploy(admin);
  await rewardStrategy.deployed();
  return rewardStrategy;
}

async function deployVeDist(
  rewardStrategy: string,
  ve: string,
  deus: string,
  utils: string
): Promise<VeDist> {
  let factory = await ethers.getContractFactory("VeDist");
  let veDist = await factory.deploy(rewardStrategy, ve, deus, utils);
  await veDist.deployed();
  return veDist;
}

async function deployRewardStrategyV2(
  maxApr: BigNumber,
  admin: string
): Promise<RewardStrategyV2> {
  let factory = await ethers.getContractFactory("RewardStrategyV2");
  let aprStrategy = await factory.deploy(maxApr, admin);
  await aprStrategy.deployed();
  return aprStrategy;
}

export {
  deployTokenTest,
  deployRewardStrategy,
  deployVeDist,
  deployUtils,
  deployRewardStrategyV2,
};
