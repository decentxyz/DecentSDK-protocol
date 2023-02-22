// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
 ______   _______  _______  _______  _       _________
(  __  \ (  ____ \(  ____ \(  ____ \( (    /|\__   __/
| (  \  )| (    \/| (    \/| (    \/|  \  ( |   ) (
| |   ) || (__    | |      | (__    |   \ | |   | |
| |   | ||  __)   | |      |  __)   | (\ \) |   | |
| |   ) || (      | |      | (      | | \   |   | |
| (__/  )| (____/\| (____/\| (____/\| )  \  |   | |
(______/ (_______/(_______/(_______/|/    )_)   )_(

*/
import {IDCNT721A} from "../interfaces/IDCNT721A.sol";

contract DCNTCrossmintAdapter  {
    /// @notice mint target DCNT721A 
    /// @param _target DCNT721A contract address
    /// @param _quantity number of tokens
    /// @param _to recipient of tokens
    function mint(address _target, uint256 _quantity, address _to) public payable {
        IDCNT721A erc721 = IDCNT721A(_target);
        uint256 start = erc721.totalSupply();
        erc721.mint{value: msg.value}(_quantity);
        for (uint256 i = start; i < start + _quantity; i++) {
            erc721.transferFrom(address(this), _to, i);
        }
    }

    /**
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external pure returns(bytes4) {
        return this.onERC721Received.selector;    
    }
}
