// Be name Khoda
// SPDX-License-Identifier: GPL-3.0

import "@openzeppelin/contracts/access/AccessControl.sol";

pragma solidity 0.8.14;

contract Utils is AccessControl {
    mapping(uint256 => uint256) public blocks;
    bytes32 public constant BLOCK_SETTER_ROLE = keccak256("BLOCK_SETTER_ROLE");

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(BLOCK_SETTER_ROLE, admin);
    }

    function getBlockNumberAt(uint256 t) external view returns (uint256) {
        return blocks[t];
    }

    function setBlockNumberAt(uint256 t, uint256 blk)
        external
        onlyRole(BLOCK_SETTER_ROLE)
    {
        blocks[t] = blk;
    }
}
