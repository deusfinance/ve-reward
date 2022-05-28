// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RewardStrategyV2 is AccessControl {
    uint256 public maxApr; // 1e6 = 100%
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400;

    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    constructor(uint256 maxApr_, address admin) {
        require(admin != address(0), "RewardStrategyV2: ZERO_ADDRESS");
        maxApr = maxApr_;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(SETTER_ROLE, admin);
    }

    function setParams(uint256 maxApr_) external onlyRole(SETTER_ROLE) {
        maxApr = maxApr_;
    }
}
