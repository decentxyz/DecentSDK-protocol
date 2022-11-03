// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/test.sol";
import "contracts/DCNT721A.sol";

contract DCNT721ATest is Test {
    DCNT721A dcnt721a;
    address payable public constant DEFAULT_OWNER_ADDRESS =
        payable(address(0x999));

    function setUp() public {
        dcnt721a = new DCNT721A();
        EditionConfig memory editionConfig = EditionConfig({
            name: "DCNT721A",
            symbol: "DCNT",
            maxTokens: 100,
            tokenPrice: 0.01 ether,
            maxTokenPurchase: 100,
            royaltyBPS: 100
        });
        MetadataConfig memory metadataConfig = MetadataConfig({
            metadataURI: "uri",
            metadataRendererInit: bytes("hello world")
        });

        dcnt721a.initialize(DEFAULT_OWNER_ADDRESS, editionConfig, metadataConfig, address(0), address(0));
    }

    function test_setOwner() public {
        assertEq(dcnt721a.owner(), DEFAULT_OWNER_ADDRESS);
        // hardhat eq - expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    }

    function test_initialState() public {
        assertEq(dcnt721a.name(), "DCNT721A");
        // hardhat eq - expect(await clone.name()).to.equal(name);
        assertEq(dcnt721a.symbol(), "DCNT");
        // hardhat eq - expect(await clone.symbol()).to.equal(symbol);
        assertEq(dcnt721a.MAX_TOKENS(), 100);
        // hardhat eq - expect(await clone.MAX_TOKENS()).to.equal(maxTokens);
        assertEq(dcnt721a.tokenPrice(), 0.01 ether);
        // hardhat eq - expect(await clone.tokenPrice()).to.equal(tokenPrice);
        assertEq(dcnt721a.maxTokenPurchase(), 100);
        // hardhat eq - expect(await clone.maxTokenPurchase()).to.equal(maxTokenPurchase);
    }
}