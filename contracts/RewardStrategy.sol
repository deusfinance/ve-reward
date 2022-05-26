// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RewardStrategy is AccessControl {
    using SafeERC20 for IERC20;

    struct RewardPoint {
        uint256 timestamp;
        uint256 amount;
    }

    mapping(uint256 => RewardPoint) public rewardPoints;
    uint256 public lastEpoch;

    constructor(address admin) {
        require(admin != address(0), "RewardStrategy: ZERO_ADDRESS");
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function getLatestRewardPerBlock() public view returns (uint256) {
        return rewardPoints[lastEpoch].amount;
    }

    function setRewardPerBlock(uint256 newRewardPerBlock) external {
        rewardPoints[++lastEpoch] = RewardPoint(
            block.timestamp,
            newRewardPerBlock
        );
    }

    function getRewardPerBlockAtTimestamp(uint256 timestamp)
        public
        view
        returns (uint256)
    {
        return rewardPoints[getEpoch(timestamp)].amount;
    }

    function getRewardPointsBetweenTimestamps(
        uint256 startTimestamp,
        uint256 endTimestamp
    ) public view returns (RewardPoint[] memory points) {
        uint256 startEpoch = getEpoch(startTimestamp);
        uint256 endEpoch = getEpoch(endTimestamp);
        uint256 length = endEpoch - startEpoch + 1;
        points = new RewardPoint[](length);
        for (uint256 i = 0; i < length; i++)
            points[i] = (rewardPoints[startEpoch + i]);
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

    function emergencyWithdrawETH(address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        payable(to).transfer(amount);
    }

    function emergencyWithdrawERC20(
        address token_,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token_).safeTransfer(to, amount);
    }
}
