import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { deployTokenTest } from "../scripts/deployHelpers";
import { VeDist } from "../typechain";
import {
  getActivePeriod,
  increaseTime,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";

describe("VeDist", () => {
  let veDist: VeDist;
  let me: SignerWithAddress;
  before(async () => {
    [me] = await ethers.getSigners();
  });
  it("should deploy VeDist", async () => {
    let veDistFactory = await ethers.getContractFactory("VeDist");
    veDist = await veDistFactory.deploy();
    await veDist.deployed();
  });
  it("should change reward pe");
});
