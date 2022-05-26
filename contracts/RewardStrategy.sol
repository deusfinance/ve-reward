// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "hardhat/console.sol";

contract RewardStrategy {
    struct RewardPoint {
        uint256 timestamp;
        uint256 amount;
    }

    mapping(uint256 => RewardPoint) public rewardPoints;
    uint256 public lastEpoch;

    constructor() {}

    function getLatestRewardPerBlock() public view returns (uint256) {
        return rewardPoints[lastEpoch].amount;
    }

    function setRewardPerBlock(uint256 newRewardPerBlock) external {
        rewardPoints[++lastEpoch] = RewardPoint(
            block.timestamp,
            newRewardPerBlock
        );
    }

    function getEpoch(uint256 timestamp) public view returns (uint256) {
        uint256 first;
        uint256 last = lastEpoch;
        while (first <= last) {
            uint256 mid = (first + last) / 2;
            if (first == last && timestamp >= rewardPoints[first].timestamp) {
                return first;
            } else if (
                timestamp >= rewardPoints[mid].timestamp &&
                timestamp < rewardPoints[mid + 1].timestamp
            ) {
                return mid;
            } else if (timestamp >= rewardPoints[mid].timestamp) {
                first = mid + 1;
            } else {
                last = mid - 1;
            }
        }
        return 0;
    }
}
