// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/Ive.sol";
import "hardhat/console.sol";

contract RewardStrategyV2 is AccessControl {
    address public ve;
    uint256[] public aprs; // epoch index => max apr

    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400;
    uint256 public constant START_WEEK = 1647475200; // Thursday, March 17, 2022 12:00:00 AM
    uint256 public constant WEEK = 7 * 86400;
    uint256 public constant DECIMALS = 1e6;
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    constructor(address admin, address ve_) {
        require(
            admin != address(0) && ve_ != address(0),
            "RewardStrategyV2: ZERO_ADDRESS"
        );
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(SETTER_ROLE, admin);

        ve = ve_;
    }

    function aprsLength() public view returns (uint256) {
        return aprs.length;
    }

    function getEpoch(uint256 timestamp) public pure returns (uint256) {
        return (timestamp / WEEK) * WEEK;
    }

    // TODO: refactor
    function getPendingStartIndex(uint256 startTime)
        public
        pure
        returns (uint256)
    {
        return
            (startTime < START_WEEK)
                ? 1
                : ((startTime - START_WEEK) / WEEK) + 2;
    }

    function getPowerAt(uint256 tokenId, uint256 time)
        public
        view
        returns (uint256)
    {
        console.log(tokenId, time);
        return Ive(ve).balanceOfNFTAt(tokenId, time);
    }

    // TODO: refactor
    function getPendingReward(
        uint256 tokenId,
        uint256 startTime,
        uint256 times
    ) external view returns (uint256, uint256) {
        uint256 index = getPendingStartIndex(startTime);
        uint256 reward;
        uint256 apr;
        uint256 power;
        uint256 epoch = getEpoch(startTime);

        // when user comes between epochs
        if (startTime > epoch) {
            power = getPowerAt(tokenId, startTime);
            apr = getAPR(tokenId, aprs[index - 1]);
            reward +=
                (apr * power * (epoch + WEEK - startTime)) /
                (DECIMALS * WEEK);
            times--;
        }
        uint256 length = min(index + times, aprs.length);
        for (uint256 i = index; i < length; i++) {
            apr = getAPR(tokenId, aprs[i]); // apr at the end of the week
            power = getPowerAt(
                tokenId,
                START_WEEK + WEEK * (i - 1) // voting power at the start of the week
            );
            reward += (apr * power) / DECIMALS; // apr sould be in week (wpr)
        }

        return (reward, epoch);
    }

    function setAPR(uint256 apr) external onlyRole(SETTER_ROLE) {
        aprs.push(apr);
    }

    function getAPR(uint256 tokenId, uint256 maxAPR)
        public
        view
        returns (uint256)
    {
        uint256 lockedTime = Ive(ve).locked__end(tokenId);
        return (maxAPR * lockedTime) / MAX_LOCK_TIME;
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return a < b ? a : b;
    }
}
