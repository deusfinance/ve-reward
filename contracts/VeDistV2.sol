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

    function _sendReward(uint256 tokenId, uint256 reward) internal {
        IDEUS(deus).mint(address(this), reward);
        IDEUS(deus).approve(ve, reward);
        Ive(ve).deposit_for(tokenId, reward);
    }

    function getPendingRewardsLength(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        uint256 startTime = getLastClaimTimestamp(tokenId);
        uint256 aprsLength = IRewardStrategyV2(rewardStrategy).aprsLength();
        uint256 pendingStartIndex = IRewardStrategyV2(rewardStrategy)
            .getPendingStartIndex(startTime);
        return aprsLength - pendingStartIndex;
    }

    function _claim(uint256 tokenId, uint256 times) public {
        require(
            Ive(ve).isApprovedOrOwner(msg.sender, tokenId),
            "VeDist: NOT_APPROVED"
        );
        uint256 startTimestamp = getLastClaimTimestamp(tokenId);
        (uint256 reward, uint256 epoch) = IRewardStrategyV2(rewardStrategy)
            .getPendingReward(tokenId, startTimestamp, times);
        rewardBalance[tokenId] += reward;
        lastClaim[tokenId] = epoch;
        if (reward > 0) _sendReward(tokenId, reward);
        emit Claim(tokenId, reward);
    }

    function claim(uint256 tokenId) external {
        uint256 times = getPendingRewardsLength(tokenId);
        _claim(tokenId, times);
    }
}
