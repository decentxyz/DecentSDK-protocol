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

/// ============ Imports ============

import "erc721a/contracts/extensions/IERC4907A.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract DCNTRentalMarket {

  struct Rentable {
    bool isListed;
    uint16 minDays;
    uint16 maxDays;
    uint256 pricePerDay;
  }

  struct RentableConfig {
    address nft;
    uint256 tokenId;
    bool isListed;
    uint256 pricePerDay;
    uint16 minDays;
    uint16 maxDays;
  }

  /// @notice mapping of rental listings by token and index
  /// @dev nft => tokenId => Rentable
  mapping(address => mapping(uint256 => Rentable)) public rentables;

  event SetRentable(
    address indexed nft,
    uint256 indexed tokenId,
    Rentable rentable
  );

  event Rent(
    address indexed nft,
    uint256 indexed tokenId,
    address indexed user,
    uint64 expires
  );

  constructor() { }

  function setRentable(
    address _nft,
    uint256 _tokenId,
    bool _isListed,
    uint256 _pricePerDay,
    uint16 _minDays,
    uint16 _maxDays
  ) external {
    _setRentable(_nft, _tokenId, _isListed, _pricePerDay, _minDays, _maxDays);
  }

  function setRentables(RentableConfig[] calldata _rentableConfigs) external {
    uint256 length = _rentableConfigs.length;
    for (uint i = 0; i < length; i++) {
      RentableConfig memory rentableConfig = _rentableConfigs[i];
      _setRentable(
        rentableConfig.nft,
        rentableConfig.tokenId,
        rentableConfig.isListed,
        rentableConfig.pricePerDay,
        rentableConfig.minDays,
        rentableConfig.maxDays
      );
    }
  }

  function _setRentable(
    address _nft,
    uint256 _tokenId,
    bool _isListed,
    uint256 _pricePerDay,
    uint16 _minDays,
    uint16 _maxDays
  ) private {
    address tokenOwner = IERC4907A(_nft).ownerOf(_tokenId);
    require(IERC4907A(_nft).supportsInterface(0xad092b5c), 'NFT does not support ERC4907');
    require(_checkApproved(_nft, _tokenId, tokenOwner), 'Token is not approved for rentals');
    require(IERC4907A(_nft).ownerOf(_tokenId) == msg.sender, 'Must be token owner to set rentable');

    rentables[_nft][_tokenId] = Rentable({
      isListed: _isListed,
      pricePerDay: _pricePerDay,
      minDays: _minDays,
      maxDays: _maxDays
    });

    emit SetRentable(
      _nft,
      _tokenId,
      rentables[_nft][_tokenId]
    );
  }

  function getRentable(
    address _nft,
    uint256 _tokenId
  ) external view returns(Rentable memory) {
    return rentables[_nft][_tokenId];
  }

  function getRentables(
    address _nft,
    uint256[] calldata _tokenIds
  ) external view returns(Rentable[] memory) {
    uint256 length = _tokenIds.length;
    Rentable[] memory returnRentables = new Rentable[](length);
    for (uint i = 0; i < length; i++) {
      returnRentables[i] = rentables[_nft][_tokenIds[i]];
    }
    return returnRentables;
  }

  function setListed(
    address _nft,
    uint256 _tokenId,
    bool _isListed
  ) external {
    _setListed(_nft, _tokenId, _isListed);
  }

  function setListedBatch(
    address _nft,
    uint256[] calldata _tokenIds,
    bool _isListed
  ) external {
    uint256 length = _tokenIds.length;
    for (uint i = 0; i < length; i++) {
      _setListed(_nft, _tokenIds[i], _isListed);
    }
  }

  function _setListed(
    address _nft,
    uint256 _tokenId,
    bool _isListed
  ) private {
    address tokenOwner = IERC4907A(_nft).ownerOf(_tokenId);
    require(_checkApproved(_nft, _tokenId, tokenOwner), 'Token is not approved for rentals');
    require(tokenOwner == msg.sender, 'Must be token owner to set listed');
    Rentable storage rentable = rentables[_nft][_tokenId];
    rentable.isListed = _isListed;

    emit SetRentable(
      _nft,
      _tokenId,
      rentable
    );
  }

  function rent(
    address _nft,
    uint256 _tokenId,
    uint16 _days
  ) external payable {
    Rentable memory rentable = rentables[_nft][_tokenId];

    // get the current token owner
    address tokenOwner = IERC4907A(_nft).ownerOf(_tokenId);

    // check for token approval or operator approval
    require(_checkApproved(_nft, _tokenId, tokenOwner), 'Token is not approved for rentals');

    // check for active listing
    require(rentable.isListed, 'Rentals are not active for this token');

    // check for current renter
    require(IERC4907A(_nft).userOf(_tokenId) == address(0), 'Token is already rented');

    // check for valid rental duration
    require((_days >= rentable.minDays) && (_days <= rentable.maxDays), 'Invalid rental duration');

    // check for rental fee
    uint256 pricePerDay = rentables[_nft][_tokenId].pricePerDay;
    require(pricePerDay > 0, 'Rental fee has not been set');

    // check for rental fee payment
    uint256 rentalPrice = pricePerDay * _days;
    uint256 payment = msg.value;
    require(payment >= rentalPrice, 'Not enough funds sent for rental');

    // check for and pay royalty
    if ( IERC4907A(_nft).supportsInterface(0x2a55205a) ) {
      address royaltyRecipient;
      uint256 royaltyAmount;
      (royaltyRecipient, royaltyAmount) = IERC2981(_nft).royaltyInfo(_tokenId, rentalPrice);

      if ( royaltyRecipient != address(0) && royaltyAmount > 0 ) {
        (bool royaltyPaid, ) = payable(royaltyRecipient).call{ value: royaltyAmount }("");
        require(royaltyPaid, "Failed to send royalty to royalty recipient");
        payment -= royaltyAmount;
      }
    }

    // pay rental fee to token owner
    (bool rentalFeePaid, ) = payable(tokenOwner).call{ value: payment }("");
    require(rentalFeePaid, "Failed to send rental fee to token owner");

    // set renter as user for rental period
    uint64 expires = uint64(block.timestamp + (_days * 1 days));
    IERC4907A(_nft).setUser(_tokenId, msg.sender, expires);

    emit Rent(
      _nft,
      _tokenId,
      msg.sender,
      expires
    );
  }

  function _checkApproved(
    address _nft,
    uint256 _tokenId,
    address _tokenOwner
  ) private view returns (bool) {
    return IERC4907A(_nft).getApproved(_tokenId) == address(this)
      || IERC4907A(_nft).isApprovedForAll(_tokenOwner, address(this));
  }
}
