import { ethers } from "hardhat";
import Blocks, { BlockResponse } from "eth-block-timestamp";
import { deployRewardStrategyV2 } from "./deployHelpers";
import { deployMockContract } from "ethereum-waffle";
import { Ive__factory } from "../typechain";
import { BigNumber } from "ethers";

async function getAddress() {
  const [admin] = await ethers.getSigners();

  const mockVe = await deployMockContract(admin, Ive__factory.abi);
  const sampleRewardStrategy = await deployRewardStrategyV2(
    admin.address,
    mockVe.address
  );
  return sampleRewardStrategy.address;
}

async function timestampToBlock(timestamp: BigNumber) {
  const _blocks = new Blocks("https://rpc.ftm.tools");
  const { block } = (await _blocks.getDate(
    timestamp.toString()
  )) as BlockResponse;
  return block;
}

async function setApr() {
  const [admin] = await ethers.getSigners();
  const rewardStrategy = await ethers.getContractAt(
    "RewardStrategyV2",
    await getAddress() // use actual contract address here
  );
  const aprs = [
    19000, // 1
    19000, // 2
    19000, // 3
    19000, // 4
    19000, // 5
    19000, // 6
    19000, // 7
    19000, // 8
    19000, // 9
    19000, // 10
    19000, // 11
    7000, // 12
  ];

  let rewardBlocks = [
    34234559, 34835624, 35416944, 35993480, 36575088, 37106977, 37568823,
    38067886, 38546237, 39062041, 39576860, 40098193,
  ];

  for (var i = 0; i < 12; i++) {
    await rewardStrategy.connect(admin).setAPR(aprs[i], rewardBlocks[i]);
    console.log(`${i + 1}/12`);
  }
}

setApr()
  .then(() => process.exit())
  .catch(console.log);
