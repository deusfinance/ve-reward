// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.14;
import "../interfaces/Ive.sol";

contract VeTest is Ive {
    function token() external view returns (address) {
        return address(0);
    }

    function balanceOfNFTAt(uint256, uint256) external view returns (uint256) {
        return 0;
    }

    function isApprovedOrOwner(address, uint256) external view returns (bool) {
        return true;
    }

    function ownerOf(uint256) external view returns (address) {
        return address(0);
    }

    function totalSupplyAtT(uint256 t) external view returns (uint256) {
        return 0;
    }

    function deposit_for(uint256 _tokenId, uint256 _value) public {}
}
