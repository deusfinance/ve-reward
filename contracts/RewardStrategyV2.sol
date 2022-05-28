// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/Ive.sol";

contract RewardStrategyV2 is AccessControl {
    address public ve;
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400;
    mapping(uint256 => AprPoint) public aprPoints; // epoch => apr point
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    struct AprPoint {
        uint256 apr; // 1e6 = 100%
        uint256 timestamp;
    }

    uint256 public lastEpoch;

    constructor(
        uint256 maxApr_,
        address ve_,
        address admin
    ) {
        require(
            admin != address(0) && ve_ != address(0),
            "RewardStrategyV2: ZERO_ADDRESS"
        );
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(SETTER_ROLE, admin);

        ve = ve_;
        _setMaxApr(maxApr_);
    }

    function setMaxApr(uint256 maxApr_) public onlyRole(SETTER_ROLE) {
        _setMaxApr(maxApr_);
    }

    function _setMaxApr(uint256 maxApr_) internal {
        aprPoints[lastEpoch++] = AprPoint(maxApr_, block.timestamp);
    }

    function getMaxApr() public view returns (uint256) {
        return aprPoints[lastEpoch - 1].apr;
    }

    function getApr(uint256 tokenId) public view returns (uint256) {
        uint256 lockedTime = Ive(ve).locked__end(tokenId);
        return (getMaxApr() * lockedTime) / MAX_LOCK_TIME;
    }
}
