// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/Ive.sol";

/// @title veDEUS reward strategy
/// @author DEUS Finance
/// @notice calculate the veDEUS rewards for every 7 days
contract RewardStrategyV2 is AccessControl {
    address public ve;
    uint256[] public aprs; // epoch index => max apr
    uint256 public constant DECIMALS = 1e6;
    uint256 public constant WEEK = 7 * 86400;
    uint256 public constant START_EPOCH = 1648080000; // Thursday, March 24, 2022 12:00:00 AM
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    event SetAPR(uint256 apr, uint256 index);

    constructor(address admin, address ve_) {
        require(
            admin != address(0) && ve_ != address(0),
            "RewardStrategyV2: ZERO_ADDRESS"
        );
        ve = ve_;

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(SETTER_ROLE, admin);
    }

    function aprsLength() public view returns (uint256) {
        return aprs.length;
    }

    function getAprAt(uint256 index) public view returns (uint256) {
        return aprs[index];
    }

    function getEpoch(uint256 timestamp) public pure returns (uint256) {
        return (timestamp / WEEK) * WEEK;
    }

    function getPendingStartIndex(uint256 startTime)
        public
        pure
        returns (uint256)
    {
        if (startTime < START_EPOCH) return 0;
        return (startTime - START_EPOCH) / WEEK + 1;
    }

    function getPowerAt(uint256 tokenId, uint256 time)
        public
        view
        returns (uint256)
    {
        return Ive(ve).balanceOfNFTAt(tokenId, time);
    }

    function getPendingReward(
        uint256 tokenId,
        uint256 startTime,
        uint256 times
    ) external view returns (uint256, uint256) {
        require(times > 0, "RewardStrategyV2: TIMES_ZERO");
        uint256 index = getPendingStartIndex(startTime);
        uint256 epoch = getEpoch(startTime);
        uint256 reward;

        if (startTime >= epoch) {
            // lock time is in the middle of the week
            epoch += WEEK;
            uint256 power = getPowerAt(tokenId, startTime);
            uint256 powerWeight = (epoch - startTime);
            reward += (power * getAprAt(index) * powerWeight) / WEEK;
            times--; // one time claimed
            index++; // one pending index increased
        }

        uint256 length = min(index + times, aprsLength());
        for (uint256 i = index; i < length; i++) {
            uint256 power = getPowerAt(tokenId, epoch);
            uint256 apr = getAprAt(i);
            reward += power * apr;
            epoch += WEEK;
        }
        return (reward, epoch);
    }

    function setAPR(uint256 apr) external onlyRole(SETTER_ROLE) {
        aprs.push(apr);
        emit SetAPR(apr, aprs.length - 1);
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return a < b ? a : b;
    }
}
