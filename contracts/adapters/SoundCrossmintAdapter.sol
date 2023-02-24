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
import {ISound721A} from "../interfaces/ISound721A.sol";

contract SoundCrossmintAdapter  {
    /// @notice mint target Sound NFT 
    /// @param _target Sound NFT contract address
    /// @param _quantity number of tokens
    /// @param _to recipient of tokens
    function mint(address _target, uint256 _quantity, address _to) public payable {
        ISound721A erc721 = ISound721A(_target);
        erc721.mint{value: msg.value}(_to, _quantity);
    }

    /**
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external pure returns(bytes4) {
        return this.onERC721Received.selector;    
    }
}
