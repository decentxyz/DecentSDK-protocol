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

import '../extensions/ERC1155Hooks.sol';
import '../storage/TokenGateConfig.sol';

/**
 * @title IDCNT1155
 * @dev An implementation of the ERC1155 multi-token standard.
 */
interface IDCNT1155 {
  /*
   * @dev A parameter object used to set the initial configuration of a token series.
   */
  struct SeriesConfig {
    string name;
    string symbol;
    string contractURI;
    string metadataURI;
    uint128 startTokenId;
    uint128 endTokenId;
    uint16 royaltyBPS;
    address feeManager;
    address payoutAddress;
    address currencyOracle;
    bool isSoulbound;
    bool hasAdjustableCaps;
  }

  /*
   * @dev The configuration settings for individual tokens within the series
   */
  struct Drop {
    uint32 maxTokens;                  // Slot 1: XXXX---------------------------- 4  bytes (max: 4,294,967,295)
    uint32 maxTokensPerOwner;          // Slot 1: ----XXXX------------------------ 4  bytes (max: 4,294,967,295)
    uint32 presaleStart;               // Slot 1: --------XXXX-------------------- 4  bytes (max: Feburary 7th, 2106)
    uint32 presaleEnd;                 // Slot 1: ------------XXXX---------------- 4  bytes (max: Feburary 7th, 2106)
    uint32 saleStart;                  // Slot 1: ----------------XXXX------------ 4  bytes (max: Feburary 7th, 2106)
    uint32 saleEnd;                    // Slot 1: --------------------XXXX-------- 4  bytes (max: Feburary 7th, 2106)
    uint96 tokenPrice;                 // Slot 2: XXXXXXXXXXXX-------------------- 12  bytes (max: 79,228,162,514 ETH)
    bytes32 presaleMerkleRoot;         // Slot 3: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX 32 bytes
    TokenGateConfig tokenGate;         // Slot 4: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX 32 bytes
  }

  /*
   * @dev Only admins can perform this action.
   */
  error OnlyAdmin();

  /*
   * @dev The provided arrays have unequal lengths.
   */
  error ArrayLengthMismatch();

  /*
   * @dev The requested token does not exist.
   */
  error NonexistentToken();

  /*
   * @dev The token supply caps are locked and cannot be adjusted.
   */
  error CapsAreLocked();

  /*
   * @dev The token supply cap cannot be decreased.
   */
  error CannotDecreaseCap();

  /*
   * @dev Insufficient minimum balance for the token gate.
   */
  error TokenGateDenied();

  /*
   * @dev Sales for this drop are not currently active.
   */
  error SaleNotActive();

  /*
   * @dev The provided funds are insufficient to complete this transaction.
   */
  error InsufficientFunds();

  /*
   * @dev The requested mint exceeds the maximum supply for this drop.
   */
  error MintExceedsMaxSupply();

  /*
   * @dev The requested mint exceeds the maximum tokens per owner for this drop.
   */
  error MintExceedsMaxTokensPerOwner();

  /*
   * @dev The requested airdrop exceeds the maximum supply for this drop.
   */
  error AirdropExceedsMaxSupply();

  /*
   * @dev The requested burn exceeds the number of owned tokens.
   */
  error BurnExceedsOwnedTokens();

  /*
   * @dev The presale is not currently active.
   */
  error PresaleNotActive();

  /*
   * @dev Verification for the presale failed.
   */
  error PresaleVerificationFailed();

  /*
   * @dev Soulbound tokens cannot be transferred.
   */
  error CannotTransferSoulbound();

  /*
   * @dev Basis points may not exceed 100_00 (100 percent)
   */
  error InvalidBPS();

  /*
   * @dev Splits are currently active and withdrawals are disabled.
   */
  error SplitsAreActive();

  /*
   * @dev Transfer of fees failed.
   */
  error FeeTransferFailed();

  /*
   * @dev Refund of excess funds failed.
   */
  error RefundFailed();

  /*
   * @dev Withdrawal of funds failed.
   */
  error WithdrawFailed();

  /**
   * @dev Initializes the contract with the specified parameters.
   * param _owner The owner of the contract.
   * param _config The configuration for the contract.
   * param _drops The drop configurations for the initial tokens.
   */
  function initialize(
    address _owner,
    SeriesConfig memory _config,
    Drop calldata _defaultDrop,
    Drop[] calldata _customDrops,
    uint256[] calldata _customDropIds
  ) external;

  /**
   * @dev Returns the name of the contract.
   */
  function name() external view returns (string memory);

  /**
   * @dev Returns the symbol of the contract.
   */
  function symbol() external view returns (string memory);

  /**
   * @dev Returns the URI for a given token ID.
   * A single URI is returned for all token types as defined in EIP-1155's token type ID substitution mechanism.
   * Clients should replace `{id}` with the actual token type ID when calling the function.
   * @dev unused @param tokenId ID of the token to retrieve the URI for.
   */
  function uri(uint256) external view returns (string memory);

  /**
   * @dev Set the URI for all token IDs.
   * @param uri_ The URI for token all token IDs.
   */
  function setURI(string memory uri_) external;

  /**
   * @dev Returns the URI of the contract metadata.
   */
  function contractURI() external view returns (string memory);

  /**
   * @dev Sets the URI of the contract metadata.
   * @param contractURI_ The URI of the contract metadata.
   */
  function setContractURI(string memory contractURI_) external;

  /**
   * @dev Updates the drop configuration for the specified token IDs.
   * @param _tokenIds The IDs of the tokens to update drop IDs for.
   * @param _tokenIdDropIds The IDs of the drops to associate with the specified token IDs.
   * @param _dropIds The IDs of the drops to update, use 0 to update the default drop configuration.
   * @param _drops The updated drop configurations for the specified drop IDs.
   */
  function setDrops(
    uint256[] calldata _tokenIds,
    uint256[] calldata _tokenIdDropIds,
    uint256[] calldata _dropIds,
    Drop[] calldata _drops
  ) external;

  /**
   * @dev Gets the current price for the specified token. If a currency oracle is set,
   * the price is calculated in native currency using the oracle exchange rate.
   * @param tokenId The ID of the token to get the price for.
   * @return The current price of the specified token.
   */
  function tokenPrice(uint256 tokenId) external view returns (uint256);

  /**
   * @dev Gets the current minting fee for the specified token.
   * @param tokenId The ID of the token to get the minting fee for.
   * @param quantity The quantity of tokens used to calculate the minting fee.
   * @return The current fee for minting the specified token.
   */
  function mintFee(uint256 tokenId, uint256 quantity) external view returns (uint256);

  /**
   * @dev Mints a specified number of tokens to a specified address.
   * @param tokenId The ID of the token to mint.
   * @param to The address to which the minted tokens will be sent.
   * @param quantity The quantity of tokens to mint.
   */
  function mint(uint256 tokenId, address to, uint256 quantity) external payable;

  /**
   * @dev Burns a specified quantity of tokens from the caller's account.
   * @param tokenId The ID of the token to burn.
   * @param quantity The quantity of tokens to burn.
   */
  function burn(uint256 tokenId, uint256 quantity) external;

  /**
   * @dev Mints a specified token to multiple recipients as part of an airdrop.
   * @param tokenId The ID of the token to mint.
   * @param recipients The list of addresses to receive the minted tokens.
   */
  function mintAirdrop(uint256 tokenId, address[] calldata recipients) external;

  /**
   * @dev Mints a specified number of tokens to the presale buyer address.
   * @param tokenId The ID of the token to mint.
   * @param quantity The quantity of tokens to mint.
   * @param maxQuantity The maximum quantity of tokens that can be minted.
   * @param pricePerToken The price per token in wei.
   * @param merkleProof The Merkle proof verifying that the presale buyer is eligible to mint tokens.
   */
  function mintPresale(
    uint256 tokenId,
    uint256 quantity,
    uint256 maxQuantity,
    uint256 pricePerToken,
    bytes32[] calldata merkleProof
  ) external payable;

  /**
   * @dev Pauses public minting.
   */
  function pause() external;

  /**
   * @dev Unpauses public minting.
   */
  function unpause() external;

  /**
   * @dev Sets the payout address to the specified address.
   * Use 0x0 to default to the contract owner.
   * @param _payoutAddress The address to set as the payout address.
   */
  function setPayoutAddress(address _payoutAddress) external;

  /**
   * @dev Withdraws the balance of the contract to the payout address or the contract owner.
  */
  function withdraw() external;

  /**
   * @dev Sets the royalty fee (ERC-2981: NFT Royalty Standard).
   * @param _royaltyBPS The royalty fee in basis points. (1/100th of a percent)
   */
  function setRoyaltyBPS(uint16 _royaltyBPS) external;

  /**
   * @dev Returns the royalty recipient and amount for a given sale price.
   * @param tokenId The ID of the token being sold.
   * @param salePrice The sale price of the token.
   * @return receiver The address of the royalty recipient.
   * @return royaltyAmount The amount to be paid to the royalty recipient.
   */
  function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external
    view
    returns (address receiver, uint256 royaltyAmount);

  /**
   * @dev Returns true if the contract supports the given interface (ERC2981 or ERC1155),
   * as specified by interfaceId, false otherwise.
   * @param interfaceId The interface identifier, as specified in ERC-165.
   * @return True if the contract supports interfaceId, false otherwise.
   */
  function supportsInterface(bytes4 interfaceId)
    external
    view
    returns (bool);

  /**
   * @dev Updates the operator filter registry with the specified subscription.
   * @param enable If true, enables the operator filter, if false, disables it.
   * @param operatorFilter The address of the operator filter subscription.
   */
  function updateOperatorFilter(bool enable, address operatorFilter) external;

  /**
   * @dev Sets or revokes approval for a third party ("operator") to manage all of the caller's tokens.
   * @param operator The address of the operator to grant or revoke approval.
   * @param approved True to grant approval, false to revoke it.
   */
  function setApprovalForAll(
    address operator,
    bool approved
  ) external;
}
