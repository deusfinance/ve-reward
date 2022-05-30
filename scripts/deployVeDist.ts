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
  admin = await ethers.getSigner(process.env.MAIN_DEPLOYER_ADDRESS!);
  let networkType = getNetworkType(network.name);
  let rewardStrategyArgs = [admin.address, networkConf[networkType!].ve];

  console.log("Deploying reward strategy...");
  //@ts-ignore
  let rewardStrategy = await deployRewardStrategyV2(...rewardStrategyArgs);
  console.log("Reward Strategy Deployed at: ", rewardStrategy.address);
  console.log("Waiting for etherscan sync...");
  await delay(1000 * 10);

  console.log("Verifing reward strategy...");

  try {
    await hre.run("verify:verify", {
      address: rewardStrategy.address,
      constructorArguments: rewardStrategyArgs,
    });
  } catch (error) {
    console.log(error);
  }
  return rewardStrategy;
}

async function deployVeDist(): Promise<VeDistV2> {
  let rewardStrategyAddress = await (await deployRewardStrategy()).address;
  // let rewardStrategyAddress = "0x78db4155463527A7B1B4d3061325E0d99b62EEBb";

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
  try {
    await hre.run("verify:verify", {
      address: veDist.address,
      constructorArguments: veDistArgs,
    });
  } catch (error) {
    console.log(error);
  }
  return veDist;
}

deployVeDist()
  .then(() => {
    process.exit();
  })
  .catch(console.log);

// veDist  0xdfe52bf46ca11c07f03cdaaa176bb2351661721a;
