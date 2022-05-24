import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TokenTest } from "../typechain";

async function deployTokenTest(): Promise<TokenTest> {
  let tokenFactory = await ethers.getContractFactory("TokenTest");
  let token = await tokenFactory.deploy();
  await token.deployed();
  return token;
}

export {
  deployTokenTest
};
