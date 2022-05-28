// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "./interfaces/IRewardStrategyV2.sol";
import "./interfaces/IDEUS.sol";
import "./interfaces/Ive.sol";

contract VeDistV2 {
    address public ve;
    address public rewardStrategy;
    address public deus;
    uint256 public constant YEAR = 365 * 86400;
    uint256 public constant APR_DECIMALS = 1e6;
    mapping(uint256 => uint256) public rewardBalance;
    mapping(uint256 => uint256) public lastClaim;

    event Claim(uint256 tokenId, uint256 amount);

    constructor(
        address ve_,
        address rewardStrategy_,
        address deus_
    ) {
        ve = ve_;
        rewardStrategy = rewardStrategy_;
        deus = deus_;
    }

    function getLastClaimTimestamp(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return
            lastClaim[tokenId] == 0
                ? Ive(ve).user_point_history__ts(tokenId, 1)
                : lastClaim[tokenId];
    }

    function getLockedBalance(uint256 tokenId) public view returns (uint256) {
        uint256 veDeusBalance = uint256(
            uint128(Ive(ve).locked(tokenId).amount)
        );
        return veDeusBalance - rewardBalance[tokenId];
    }

    function _sendReward(uint256 tokenId, uint256 reward) internal {
        IDEUS(deus).mint(address(this), reward);
        IDEUS(deus).approve(ve, reward);
        Ive(ve).deposit_for(tokenId, reward);
    }

    function getRewardAmount(uint256 tokenId) public view returns (uint256) {
        uint256 lastClaimTimestamp = getLastClaimTimestamp(tokenId);
        uint256 apr = IRewardStrategyV2(rewardStrategy).getApr(tokenId);
        uint256 lockedBalance = getLockedBalance(tokenId);
        uint256 reward = ((block.timestamp - lastClaimTimestamp) *
            apr *
            lockedBalance) / (YEAR * APR_DECIMALS);
        return reward;
    }

    function claim(uint256 tokenId) external {
        lastClaim[tokenId] = block.timestamp;
        uint256 reward = getRewardAmount(tokenId);
        rewardBalance[tokenId] += reward;
        _sendReward(tokenId, reward);
        emit Claim(tokenId, reward);
    }
}
