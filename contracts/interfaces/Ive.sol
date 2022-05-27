// SPDX-License-Identifier: GPL3.0-or-later

pragma solidity 0.8.14;

interface Ive {
    function token() external view returns (address);

    function balanceOfNFTAt(uint256, uint256) external view returns (uint256);

    function isApprovedOrOwner(address, uint256) external view returns (bool);

    function ownerOf(uint256) external view returns (address);

    function totalSupplyAt(uint256 blk) external view returns (uint256);

    function deposit_for(uint256 _tokenId, uint256 _value) external;
}
