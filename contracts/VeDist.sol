// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "./RewardStrategy.sol";

contract VeDist {
    address public rewardStrategy;

    mapping(address => uint256) public lastClaimPeriod; // user => last claim period
    uint256 internal constant WEEK = 7 days;

    constructor(address rewardStrategy_) {
        require(rewardStrategy_ != address(0), "VeDist: ZERO_ADDRESS");
        rewardStrategy = rewardStrategy_;
    }

    function getActivePeriod() public view returns (uint256) {
        return (block.timestamp / WEEK) * WEEK;
    }

    function getLatestPeriod() public view returns (uint256) {
        return getActivePeriod() - WEEK;
    }

    function getPendingRewardPeriods(address user)
        public
        view
        returns (uint256[] memory periods)
    {
        uint256 latest = getLatestPeriod();
        uint256 last = lastClaimPeriod[user];
        uint256 length = (latest - last) / WEEK;
        periods = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            periods[i] = last + ((i + 1) * WEEK);
        }
    }

    function claim() public {
        lastClaimPeriod[msg.sender] = getActivePeriod();
    }
}
