// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PRBLToken.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/MerkleProof.sol";

contract PRBLRewardsDistributor {

    PRBLToken public token;

    mapping(uint256 => bytes32) public merkleRoot;
    mapping(uint256 => mapping(address => bool)) public claimed;

    constructor(address token_) {
        token = PRBLToken(token_);
    }

    function setEpochRoot(uint256 epochId, bytes32 root) external {
        merkleRoot[epochId] = root;
    }

    function claim(
        uint256 epochId,
        uint256 amount,
        bytes32[] calldata proof
    ) external {

        require(!claimed[epochId][msg.sender], "already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));

        require(
            MerkleProof.verify(proof, merkleRoot[epochId], leaf),
            "invalid proof"
        );

        claimed[epochId][msg.sender] = true;

        token.mint(msg.sender, amount);
    }
}
