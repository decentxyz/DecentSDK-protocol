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

contract CrossmintDecentAdapter  {
    IDCNT721A public erc721;

    constructor(address _erc721) {
        erc721 = IDCNT721A(_erc721);
    }

    function mint(uint256 _quantity, address _to) public payable {
         uint256 start = erc721.totalSupply();
        erc721.mint{value: msg.value}(_quantity);
        for (uint256 i = start; i < start + _quantity; i++) {
            erc721.transferFrom(address(this), _to, i);
        }
    }

    function totalSupply() public view returns(uint256 start) {
        start = erc721.totalSupply();
    }

    /**
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external pure returns(bytes4) {
        return this.onERC721Received.selector;    
    }
}
