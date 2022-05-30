// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IRewardStrategyV2.sol";
import "./interfaces/Ive.sol";

contract VeDistV2 is AccessControl {
    using SafeERC20 for IERC20;

    address public rewardStrategy;
    address public deus;
    address public ve;
    mapping(uint256 => uint256) public lastClaim;

    event Claim(uint256 tokenId, uint256 amount);
    event SetRewardStrategy(
        address oldRewardStrategy,
        address newRewardStrategy
    );

    constructor(
        address admin,
        address ve_,
        address rewardStrategy_,
        address deus_
    ) {
        ve = ve_;
        rewardStrategy = rewardStrategy_;
        deus = deus_;

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function getPendingRewardsLength(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        uint256 lastClaimTime = getLastClaimTimestamp(tokenId);
        uint256 aprsLength = IRewardStrategyV2(rewardStrategy).aprsLength();
        uint256 pendingStartIndex = IRewardStrategyV2(rewardStrategy)
            .getPendingStartIndex(lastClaimTime);
        return aprsLength - pendingStartIndex;
    }

    function getLastClaimTimestamp(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return
            lastClaim[tokenId] == 0
                ? startLockTime(tokenId)
                : lastClaim[tokenId];
    }

    function startLockTime(uint256 tokenId) public view returns (uint256) {
        return Ive(ve).user_point_history__ts(tokenId, 1);
    }

    function getPendingReward(uint256 tokenId) external view returns (uint256) {
        uint256 times = getPendingRewardsLength(tokenId);

        (uint256 reward, ) = _getPendingReward(tokenId, times);
        return reward;
    }

    function _getPendingReward(uint256 tokenId, uint256 times)
        internal
        view
        returns (uint256, uint256)
    {
        uint256 lastClaimTime = getLastClaimTimestamp(tokenId);
        (uint256 reward, uint256 epoch) = IRewardStrategyV2(rewardStrategy)
            .getPendingReward(tokenId, lastClaimTime, times);
        return (reward, epoch);
    }

    function _sendReward(uint256 tokenId, uint256 reward) internal {
        IERC20(deus).safeApprove(ve, reward);
        Ive(ve).deposit_for(tokenId, reward);
    }

    function _claim(uint256 tokenId, uint256 times) public {
        require(
            Ive(ve).isApprovedOrOwner(msg.sender, tokenId),
            "VeDist: NOT_APPROVED"
        );
        (uint256 reward, uint256 epoch) = _getPendingReward(tokenId, times);
        lastClaim[tokenId] = epoch;
        if (reward > 0) _sendReward(tokenId, reward);
        emit Claim(tokenId, reward);
    }

    function claim(uint256 tokenId) public {
        _claim(tokenId, getPendingRewardsLength(tokenId));
    }

    function claimAll(uint256[] memory tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _claim(tokenIds[i], getPendingRewardsLength(tokenIds[i]));
        }
    }

    function setRewardStrategy(address rewardStrategy_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit SetRewardStrategy(rewardStrategy, rewardStrategy_);
        rewardStrategy = rewardStrategy_;
    }

    function withdrawERC20(
        address token,
        address recv,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(recv, amount);
    }
}
