// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FirstExpenseNFT V3 - Standard ERC721
 * @dev Uses standard IPFS metadata approach (recommended by OpenSea)
 *
 * How it works:
 * 1. Upload metadata JSON to IPFS (contains name, description, image in Chinese)
 * 2. Deploy contract with metadata IPFS URL
 * 3. tokenURI() returns: ipfs://QmMetadataHash
 * 4. Wallets fetch and display the JSON content
 */
contract FirstExpenseNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    mapping(address => bool) public hasMinted;

    // IPFS URL pointing to metadata JSON file
    string public metadataURI;

    event FirstExpenseMinted(address indexed user, uint256 tokenId);
    event MetadataURIUpdated(string newMetadataURI);

    /**
     * @param _metadataURI IPFS URL of metadata JSON, e.g.: ipfs://QmMetadataHash/metadata.json
     */
    constructor(string memory _metadataURI) ERC721("First Expense NFT", "FENFT") Ownable(msg.sender) {
        tokenCounter = 0;
        metadataURI = _metadataURI;
    }

    /**
     * @dev Mint first expense NFT
     */
    function mintFirstExpense() external {
        require(!hasMinted[msg.sender], "User has already minted first expense NFT");

        uint256 newTokenId = tokenCounter;
        _safeMint(msg.sender, newTokenId);

        hasMinted[msg.sender] = true;
        tokenCounter++;

        emit FirstExpenseMinted(msg.sender, newTokenId);
    }

    /**
     * @dev Return NFT metadata URI
     * All metadata (name, description, image, attributes) are stored in IPFS JSON
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");
        return metadataURI;
    }

    /**
     * @dev Update metadata URI (owner only)
     */
    function setMetadataURI(string memory _metadataURI) external onlyOwner {
        metadataURI = _metadataURI;
        emit MetadataURIUpdated(_metadataURI);
    }
}
