// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import "solmate/src/tokens/ERC1155.sol";
import "@openzeppelin/contracts/utils/Context.sol";

abstract contract DCNT1155Extended is Context, ERC1155 {

  // Used as the URI for all token types by relying on
  // ID substitution, e.g. https://token-cdn-domain/{id}.json
  string private _uri;

  function uri(uint256) public view override returns (string memory) {
      return _uri;
  }

  function _setURI(string memory newuri) internal virtual {
      _uri = newuri;
  }

  function burn(
      address account,
      uint256 id,
      uint256 value
  ) public {
      require(
          account == _msgSender() || isApprovedForAll[account][_msgSender()],
          "ERC1155: caller is not owner nor approved"
      );

      _burn(account, id, value);
  }

  function burnBatch(
      address account,
      uint256[] memory ids,
      uint256[] memory values
  ) public {
      require(
          account == _msgSender() || isApprovedForAll[account][_msgSender()],
          "ERC1155: caller is not owner nor approved"
      );

      _batchBurn(account, ids, values);
  }

  function _beforeTokenTransfer(
      address operator,
      address from,
      address to,
      uint256[] memory ids,
      uint256[] memory amounts,
      bytes memory data
  ) internal virtual {}

  function safeTransferFrom(
      address from,
      address to,
      uint256 id,
      uint256 amount,
      bytes calldata data
  ) public virtual override {
      address operator = _msgSender();
      _beforeTokenTransfer(operator, from, to, _asSingletonArray(id), _asSingletonArray(amount), data);
      super.safeTransferFrom(from, to, id, amount, data);
  }

  function safeBatchTransferFrom(
      address from,
      address to,
      uint256[] calldata ids,
      uint256[] calldata amounts,
      bytes calldata data
  ) public virtual override {
      address operator = _msgSender();
      _beforeTokenTransfer(operator, from, to, ids, amounts, data);
      super.safeBatchTransferFrom(from, to, ids, amounts, data);
  }

  function _mint(
      address to,
      uint256 id,
      uint256 amount,
      bytes memory data
  ) internal virtual override {
      address operator = _msgSender();
      _beforeTokenTransfer(operator, address(0), to, _asSingletonArray(id), _asSingletonArray(amount), data);
      super._mint(to, id, amount, data);
  }

  function _batchMint(
      address to,
      uint256[] memory ids,
      uint256[] memory amounts,
      bytes memory data
  ) internal virtual override {
      address operator = _msgSender();
      _beforeTokenTransfer(operator, address(0), to, ids, amounts, data);
      super._batchMint(to, ids, amounts, data);
  }

  function _burn(
      address from,
      uint256 id,
      uint256 amount
  ) internal virtual override {
      address operator = _msgSender();
      _beforeTokenTransfer(operator, from, address(0), _asSingletonArray(id), _asSingletonArray(amount), "");
      super._burn(from, id, amount);
  }

  function _batchBurn(
      address from,
      uint256[] memory ids,
      uint256[] memory amounts
  ) internal virtual override {
      address operator = _msgSender();
      _beforeTokenTransfer(operator, from, address(0), ids, amounts, "");
      super._batchBurn(from, ids, amounts);
  }

  function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
      uint256[] memory array = new uint256[](1);
      array[0] = element;

      return array;
  }
}
