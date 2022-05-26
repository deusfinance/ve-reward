// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "./interfaces/IRewardStrategy.sol";
import "./interfaces/Ive.sol";
import "hardhat/console.sol";

contract VeDist {
    address public rewardStrategy;
    address public ve;
    mapping(uint256 => uint256) public lastClaimPeriod; // user => last claim period
    uint256 internal constant WEEK = 7 days;
    uint256 public startPeriod;

    constructor(address rewardStrategy_, address ve_) {
        require(
            rewardStrategy_ != address(0) && ve_ != address(0),
            "VeDist: ZERO_ADDRESS"
        );
        rewardStrategy = rewardStrategy_;
        ve = ve_;
        startPeriod = getLatestPeriod();
    }

    function getLastClaimPeriod(uint256 tokenId) public view returns (uint256) {
        if (lastClaimPeriod[tokenId] == 0) return startPeriod;
        return lastClaimPeriod[tokenId];
    }

    function getActivePeriod() public view returns (uint256) {
        return getPeriod(block.timestamp);
    }

    function getLatestPeriod() public view returns (uint256) {
        return getActivePeriod() - WEEK;
    }

    function getPeriod(uint256 timestamp) public pure returns (uint256) {
        return (timestamp / WEEK) * WEEK;
    }

    function getPendingRewardPeriods(uint256 tokenId)
        public
        view
        returns (uint256[] memory periods)
    {
        uint256 latest = getLatestPeriod();
        uint256 last = getLastClaimPeriod(tokenId);
        uint256 length = (latest - last) / WEEK;
        periods = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            periods[i] = last + ((i + 1) * WEEK);
        }
    }

    function getShareAt(uint256 tokenId, uint256 period)
        public
        view
        returns (uint256)
    {
        uint256 power = Ive(ve).balanceOfNFTAt(tokenId, period);
        uint256 reward = IRewardStrategy(rewardStrategy).getRewardAmount(
            period,
            period + WEEK
        );
        uint256 totalPower = Ive(ve).totalSupplyAtT(period);
        return (power * reward) / totalPower;
    }

    function getPendingRewardsTimes(uint256 tokenId, uint256 times)
        public
        view
        returns (uint256)
    {
        uint256[] memory pendingRewards = getPendingRewardPeriods(tokenId);

        uint256 length = (times < pendingRewards.length)
            ? times
            : pendingRewards.length;
        uint256 rewards;
        for (uint256 i = 0; i < length; i++)
            rewards += getShareAt(tokenId, pendingRewards[i]);
        return rewards;
    }

    function claimTimes(uint256 tokenId, uint256 times) public {
        require(
            Ive(ve).isApprovedOrOwner(msg.sender, tokenId),
            "VeDist: NOT_APPROVED"
        );
        lastClaimPeriod[tokenId] = getLastClaimPeriod(tokenId) + times * WEEK;
        uint256 rewards = getPendingRewardsTimes(tokenId, times);
        Ive(ve).deposit_for(tokenId, rewards);
    }

    function claim(uint256 tokenId) public {
        uint256 times = getPendingRewardPeriods(tokenId).length;
        claimTimes(tokenId, times);
    }
}
