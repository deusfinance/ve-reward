// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.14;

interface IDEUS {
    function mint(address to, uint256 amount) external;

    function approve(address spender, uint256 amount) external returns (bool);
}
