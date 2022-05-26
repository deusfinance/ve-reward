// SPDX-License-Identifier: GPL3.0-or-later

pragma solidity 0.8.14;

interface IRewardStrategy {
    function getRewardAmount(uint256 startTimestamp, uint256 endTimestamp)
        external
        view
        returns (uint256);
}
