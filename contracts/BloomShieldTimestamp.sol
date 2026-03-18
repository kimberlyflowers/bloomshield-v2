// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BloomShieldTimestamp
 * @dev Smart contract for BloomShield - Creative Work Protection System
 * Stores all 5 protection hashes on Polygon blockchain:
 *   1. Legal Hash (SHA-256) - cryptographic fingerprint
 *   2. Content Hash (dHash) - perceptual similarity detection
 *   3. Floral Hash - BLOOM branded asset ID
 *   4. IPFS Hash - decentralized metadata CID
 *   5. Blockchain TX Hash - created automatically by this transaction
 */
contract BloomShieldTimestamp {

    address public owner;

    struct TimestampRecord {
        string legalHash;      // SHA-256
        string contentHash;    // Perceptual dHash
        string floralHash;     // BLOOM branded ID (BS-xxxx-xxxx-xxxx)
        string ipfsHash;       // IPFS CID from Pinata
        string fileName;
        uint256 timestamp;
        address creator;
        bool exists;
    }

    mapping(string => TimestampRecord) public timestamps;
    string[] public legalHashes;

    event TimestampCreated(
        string indexed legalHash,
        string contentHash,
        string floralHash,
        string ipfsHash,
        string fileName,
        uint256 timestamp,
        address creator
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Create a new timestamp record with all 5 hashes
     * @param legalHash SHA-256 cryptographic hash of the file
     * @param contentHash Perceptual dHash for similarity detection
     * @param floralHash BLOOM branded asset identifier
     * @param ipfsHash IPFS CID of the metadata pinned to Pinata
     * @param fileName Original file name
     */
    function createTimestamp(
        string calldata legalHash,
        string calldata contentHash,
        string calldata floralHash,
        string calldata ipfsHash,
        string calldata fileName
    ) external returns (bool) {
        require(bytes(legalHash).length > 0, "Legal hash cannot be empty");
        require(bytes(contentHash).length > 0, "Content hash cannot be empty");
        require(bytes(floralHash).length > 0, "Floral hash cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(fileName).length > 0, "File name cannot be empty");

        require(!timestamps[legalHash].exists, "Timestamp already exists for this file");

        timestamps[legalHash] = TimestampRecord({
            legalHash: legalHash,
            contentHash: contentHash,
            floralHash: floralHash,
            ipfsHash: ipfsHash,
            fileName: fileName,
            timestamp: block.timestamp,
            creator: msg.sender,
            exists: true
        });

        legalHashes.push(legalHash);

        emit TimestampCreated(
            legalHash,
            contentHash,
            floralHash,
            ipfsHash,
            fileName,
            block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @dev Verify a timestamp — returns all 5 hashes
     * @param legalHash SHA-256 hash to look up
     */
    function getTimestamp(string calldata legalHash)
        external
        view
        returns (
            bool exists,
            string memory contentHash,
            string memory floralHash,
            string memory ipfsHash,
            string memory fileName,
            uint256 timestamp,
            address creator
        )
    {
        TimestampRecord storage record = timestamps[legalHash];
        require(record.exists, "Timestamp not found");

        return (
            record.exists,
            record.contentHash,
            record.floralHash,
            record.ipfsHash,
            record.fileName,
            record.timestamp,
            record.creator
        );
    }

    function timestampExists(string calldata legalHash)
        external
        view
        returns (bool)
    {
        return timestamps[legalHash].exists;
    }

    function getTotalTimestamps() external view returns (uint256) {
        return legalHashes.length;
    }

    function getLegalHashAt(uint256 index)
        external
        view
        returns (string memory)
    {
        require(index < legalHashes.length, "Index out of bounds");
        return legalHashes[index];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function renounceOwnership() external onlyOwner {
        address previousOwner = owner;
        owner = address(0);
        emit OwnershipTransferred(previousOwner, address(0));
    }
}
