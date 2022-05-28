// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "./interfaces/IRewardStrategyV2.sol";
import "./interfaces/IDEUS.sol";
import "./interfaces/Ive.sol";

contract VeDistV2 {
    address public rewardStrategy;
    address public deus;
    address public ve;
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

    function claim(uint256 tokenId, uint256 times) public {
        uint256 startTimestamp = getLastClaimTimestamp(tokenId);
        (uint256 reward, uint256 epoch) = IRewardStrategyV2(rewardStrategy)
            .getPendingReward(tokenId, startTimestamp, times);
        rewardBalance[tokenId] += reward;
        lastClaim[tokenId] = epoch;
        _sendReward(tokenId, reward);
        emit Claim(tokenId, reward);
    }

    function claim(tokenId) external {
        uint256 times; // todo: calculate times
        claim(tokenId, times);
    }
}
