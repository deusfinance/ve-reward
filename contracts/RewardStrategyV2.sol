// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/Ive.sol";

contract RewardStrategyV2 is AccessControl {
    uint256 public maxApr; // 1e6 = 100%
    address public ve;
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400;

    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    constructor(
        uint256 maxApr_,
        address ve_,
        address admin
    ) {
        require(
            admin != address(0) && ve_ != address(0),
            "RewardStrategyV2: ZERO_ADDRESS"
        );
        maxApr = maxApr_;
        ve = ve_;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(SETTER_ROLE, admin);
    }

    function getApr(uint256 tokenId) public view returns (uint256) {
        uint256 lockedTime = Ive(ve).locked__end(tokenId);
        return (maxApr * lockedTime) / MAX_LOCK_TIME;
    }

    function setParams(uint256 maxApr_, address ve_)
        external
        onlyRole(SETTER_ROLE)
    {
        require(ve_ != address(0), "RewardStrategyV2: ZERO_ADDRESS");
        maxApr = maxApr_;
        ve = ve_;
    }
}
