import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { deployRewardStrategyV2, deployVeDistV2 } from "./deployHelpers";
import { getNetworkType, networkConf } from "./networks";
import hre from "hardhat";
import { RewardStrategyV2, VeDistV2 } from "../typechain";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployRewardStrategy(): Promise<RewardStrategyV2> {
  let admin: SignerWithAddress;
  admin = await ethers.getSigner(process.env.TESTER_ADDRESS!);
  let networkType = getNetworkType(network.name);
  let rewardStrategyArgs = [admin.address, networkConf[networkType!].ve];

  console.log("Deploying reward strategy...");
  //@ts-ignore
  let rewardStrategy = await deployRewardStrategyV2(...rewardStrategyArgs);
  console.log("Reward Strategy Deployed at: ", rewardStrategy.address);
  console.log("Waiting for etherscan sync...");
  await delay(1000 * 10);

  console.log("Verifing reward strategy...");

  await hre.run("verify:verify", {
    address: rewardStrategy.address,
    constructorArguments: rewardStrategyArgs,
  });
  return rewardStrategy;
}

async function deployVeDist(): Promise<VeDistV2> {
  //   let rewardStrategyAddress = await (await deployRewardStrategyV2()).address;
  let rewardStrategyAddress = "0x392ee567631f79c610656bcf12cdea39afdba54b";

  let admin: SignerWithAddress;
  admin = await ethers.getSigner(process.env.MAIN_DEPLOYER_PRIVATE_KEY!);
  let networkType = getNetworkType(network.name);
  let veDistArgs = [
    networkConf[networkType!].admin,
    networkConf[networkType!].ve,
    rewardStrategyAddress,
    networkConf[networkType!].deus,
  ];

  console.log("Deploying VeDist...");
  //@ts-ignore
  let veDist = await deployVeDistV2(...veDistArgs);
  console.log("VeDist deployed at: ", veDist.address);
  console.log("Waiting for etherscan sync...");
  await delay(1000 * 10);
  await hre.run("verify:verify", {
    address: veDist.address,
    constructorArguments: veDistArgs,
  });
  return veDist;
}

deployVeDist()
  .then(() => {
    process.exit();
  })
  .catch(console.log);

// veDist  0xdfe52bf46ca11c07f03cdaaa176bb2351661721a;
