// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

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
        uint256 start;
        uint256 end = lastEpoch;
        while (start < end) {
            uint256 mid = (end + start) / 2;
            if (
                timestamp >= rewardPoints[mid].timestamp &&
                timestamp < rewardPoints[mid + 1].timestamp
            ) return mid;
            if (timestamp > rewardPoints[mid].timestamp) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        return 0;
    }
}
