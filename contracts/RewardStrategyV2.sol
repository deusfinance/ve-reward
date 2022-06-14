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
    mapping(uint256 => uint256) public aprs; // epoch index => max apr
    mapping(uint256 => uint256) public timeToBlock;
    uint256 public aprsLength;
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

    /// @notice the last thursday night before the given timestamp
    /// @param  timestamp: timestamp in seconds
    /// @return - the epoch related to the timestamp
    function getEpoch(uint256 timestamp) public pure returns (uint256) {
        return (timestamp / WEEK) * WEEK;
    }

    /// @notice calculates the index of the first epoch that user can claim
    /// @param startTime: the time from which first eligible
    /// @return - index of first eligible index to claim
    function getPendingStartIndex(uint256 startTime)
        public
        pure
        returns (uint256)
    {
        if (startTime < START_EPOCH) return 0;
        return (startTime - START_EPOCH) / WEEK + 1;
    }

    /// @notice collects the amount of pending rewards, from the given time up to now
    /// @param startTime: the timestamp(in seconds) from which pending rewards are calculated
    /// @return - total claimed reward and the next eligible epoch
    function getPendingReward(
        uint256 tokenId,
        uint256 startTime,
        uint256 times
    ) external view returns (uint256, uint256) {
        require(times > 0, "RewardStrategyV2: TIMES_ZERO");
        uint256 index = getPendingStartIndex(startTime);
        uint256 epoch = getEpoch(startTime);
        uint256 length = min(index + times, aprsLength);
        uint256 reward;

        for (uint256 i = index; i < length; i++) {
            uint256 _startTime = max(startTime, epoch);
            uint256 power = Ive(ve).balanceOfAtNFT(
                tokenId,
                timeToBlock[_startTime]
            );
            uint256 endOfWeek = epoch + WEEK;
            uint256 powerWeight = (endOfWeek - _startTime);
            reward += (power * aprs[i] * powerWeight) / (DECIMALS * WEEK);
            epoch += WEEK;
        }
        return (reward, epoch);
    }

    /// @notice set APR per week
    /// @param apr apr to be sest
    function setAPRAt(
        uint256 index,
        uint256 apr,
        uint256 _block
    ) public onlyRole(SETTER_ROLE) {
        aprs[index] = apr;
        timeToBlock[START_EPOCH + index * WEEK] = _block;
        emit SetAPR(apr, index);
    }

    function setAPR(uint256 apr, uint256 _block) external {
        setAPRAt(aprsLength, apr, _block);
        aprsLength++;
    }

    function max(uint256 a, uint256 b) public pure returns (uint256) {
        return a > b ? a : b;
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return a < b ? a : b;
    }
}
