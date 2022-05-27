import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployUtils } from "../scripts/deployHelpers";
import { Utils } from "../typechain";
import { getCurrentBlock, getCurrentTimeStamp } from "./timeUtils";

describe("Utils", () => {
  let utils: Utils;
  let me: SignerWithAddress;
  let user1: SignerWithAddress;
  before(async () => {
    [me, user1] = await ethers.getSigners();
    utils = await deployUtils(me.address);
  });
  it("should set blockNumber for specific blockTime", async () => {
    let timestamp = await getCurrentTimeStamp();
    let blockNumber = await getCurrentBlock();
    await utils.setBlockNumberAt(timestamp, blockNumber);
    let blk = await utils.getBlockNumberAt(timestamp);
    expect(blockNumber).eq(blk);
  });
  it("shouldn't let other users to set block number", async () => {
    let timestamp = await getCurrentTimeStamp();
    let blockNumber = await getCurrentBlock();
    let set = utils.connect(user1).setBlockNumberAt(timestamp, blockNumber);
    await expect(set).to.be.revertedWith(
      "AccessControl: account 0x1492c6aa1496c820a3430a996852baef32f60a73 is missing role 0x0bebfc6d98f2ce435f8100f79772cda7dd279367313182867ae1749b4b72a14d"
    );
  });
});
