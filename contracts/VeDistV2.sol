// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IRewardStrategyV2.sol";
import "./interfaces/Ive.sol";

/// @title veDEUS reward distributer
/// @author DEUS Finance
/// @notice Distribute the veDEUS rewards to the veDEUS balances
contract VeDistV2 is AccessControl {
    using SafeERC20 for IERC20;

    address public rewardStrategy;
    address public deus;
    address public ve;
    mapping(uint256 => uint256) public lastClaim; // tokenId => lastClaimTimestamp

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

    /// @notice calculate the pending epochs for claim
    /// @param tokenId veDEUS tokenId
    /// @return number of pending epochs to claim
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

    /// @notice return the last claim time
    /// @param tokenId veDEUS tokenId
    /// @return timestamp of last claim
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

    /// @notice read the timestamp of create veDEUS nft from veDEUS contract
    /// @param tokenId veDEUS tokenId
    /// @return time of create lock in veDEUS
    function startLockTime(uint256 tokenId) public view returns (uint256) {
        return Ive(ve).user_point_history__ts(tokenId, 1);
    }

    /// @notice calculate the pending reward amount in 18 decimals
    /// @param tokenId veDEUS tokenId
    /// @return amount of reward in DEUS
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

    /// @notice claim the rewards in number of `times`
    /// @param tokenId veDEUS tokenId
    /// @param times number of epochs
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

    /// @notice claim the all pending rewards
    /// @param tokenId veDEUS tokenId
    function claim(uint256 tokenId) public {
        _claim(tokenId, getPendingRewardsLength(tokenId));
    }

    /// @notice claim the all pending rewards for all veDEUS nfts
    /// @param tokenIds list of veDEUS tokenIds
    function claimAll(uint256[] memory tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _claim(tokenIds[i], getPendingRewardsLength(tokenIds[i]));
        }
    }

    /// @notice sets new reward strategy contract
    /// @param rewardStrategy_ address of reward strategy contract
    function setRewardStrategy(address rewardStrategy_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit SetRewardStrategy(rewardStrategy, rewardStrategy_);
        rewardStrategy = rewardStrategy_;
    }

    /// @notice withraw erc20 tokens in emergency states
    /// @param token address of erc20 token
    /// @param recv address of receiver
    /// @param amount token amount
    function withdrawERC20(
        address token,
        address recv,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(recv, amount);
    }
}
