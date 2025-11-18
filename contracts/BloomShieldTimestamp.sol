// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BloomShieldTimestamp {
    struct Timestamp {
        string legalHash;
        string contentHash;
        string floralHash;
        string fileName;
        address creator;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(string => Timestamp) public timestamps;

    event TimestampCreated(
        string indexed legalHash,
        address indexed creator,
        uint256 timestamp
    );

    function createTimestamp(
        string memory legalHash,
        string memory contentHash,
        string memory floralHash,
        string memory fileName
    ) public {
        require(bytes(timestamps[legalHash].legalHash).length == 0, "Already timestamped");

        timestamps[legalHash] = Timestamp({
            legalHash: legalHash,
            contentHash: contentHash,
            floralHash: floralHash,
            fileName: fileName,
            creator: msg.sender,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        emit TimestampCreated(legalHash, msg.sender, block.timestamp);
    }

    function getTimestamp(string memory legalHash) public view returns (Timestamp memory) {
        return timestamps[legalHash];
    }
}
