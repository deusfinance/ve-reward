// SPDX-License-Identifier: GPL3.0-or-later

pragma solidity 0.8.14;

interface Ive {
    struct LockedBalance {
        int128 amount;
        uint256 end;
    }

    function token() external view returns (address);

    function balanceOfNFTAt(uint256, uint256) external view returns (uint256);

    function balanceOfAtNFT(uint256, uint256) external view returns (uint256);

    function isApprovedOrOwner(address, uint256) external view returns (bool);

    function ownerOf(uint256) external view returns (address);

    function totalSupplyAt(uint256 blk) external view returns (uint256);

    function deposit_for(uint256 _tokenId, uint256 _value) external;

    function locked(uint256) external view returns (LockedBalance memory);

    function locked__end(uint256) external view returns (uint256);

    function user_point_history__ts(uint256 tokenId, uint256 _idx)
        external
        view
        returns (uint256);
}
