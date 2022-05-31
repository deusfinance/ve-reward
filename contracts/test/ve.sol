// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.14;
import "../interfaces/Ive.sol";

contract VeTest is Ive {
    function token() external pure returns (address) {
        return address(0);
    }

    function balanceOfNFTAt(uint256, uint256) external pure returns (uint256) {
        return 0;
    }

    function isApprovedOrOwner(address, uint256) external pure returns (bool) {
        return true;
    }

    function ownerOf(uint256) external pure returns (address) {
        return address(0);
    }

    function totalSupplyAt(uint256) external pure returns (uint256) {
        return 0;
    }

    function deposit_for(uint256 _tokenId, uint256 _value) public {}

    function locked(uint256) external view returns (LockedBalance memory) {}

    function locked__end(uint256) external view returns (uint256) {}

    function user_point_history__ts(uint256 tokenId, uint256 _idx)
        external
        view
        returns (uint256)
    {}
}
