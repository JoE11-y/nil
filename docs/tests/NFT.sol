// SPDX-License-Identifier: MIT
//startContract
pragma solidity ^0.8.0;

import "@nilfoundation/smart-contracts/contracts/Nil.sol";
import "@nilfoundation/smart-contracts/contracts/NilTokenBase.sol";

/**
 * @title NFT
 * @author =nil; Foundation
 * @notice The contract represents an NFT that can be minted and transferred.
 */
contract NFT is NilTokenBase {
    /**
     * @dev The property locks down the contract after the NFT has been transferred.
     */
    bool private hasBeenSent = false;

    /**
     * @notice A 'wrapper' over mintTokenInternal(). Only one NFT can be minted.
     */
    function mintNFT() public {
        require(totalSupply == 0, "NFT has already been minted");
        require(!hasBeenSent, "NFT has already been sent");
        mintTokenInternal(1);
    }

    /**
     * @notice The function sends the NFT to the provided address.
     * @param dst The address to which the NFT must be sent.
     */
    function sendNFT(address dst) public {
        require(!hasBeenSent, "NFT has already been sent");
        Nil.Token[] memory nft = new Nil.Token[](1);
        nft[0].id = getTokenId();
        nft[0].amount = 1;
        Nil.asyncCallWithTokens(
            dst,
            msg.sender,
            msg.sender,
            0,
            Nil.FORWARD_REMAINING,
            0,
            nft,
            ""
        );
        hasBeenSent = true;
    }

    /**
     *
     * @notice The empty override ensures that the NFT can only be minted via mintNFT().
     */
    function mintToken(uint256 amount) public override onlyExternal {}

    /**
     *
     * @notice The empty override ensures that the NFT cannot be burned.
     */
    function burnToken(uint256 amount) public override onlyExternal {}
}
//endContract
