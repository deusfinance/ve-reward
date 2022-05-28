// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.14;

interface IRewardStrategyV2 {
    function getApr(uint256 tokenId) external view returns (uint256);
}
