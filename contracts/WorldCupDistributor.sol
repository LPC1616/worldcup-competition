// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/MerkleProof.sol";
import "./libraries/TransferHelper.sol";

// 0x382eAc081a3323A21826cEf7ac88530738B1275b
contract WorldCupDistributor {
    // 将TransferHelper里的方法绑定到address类型。用法：（address）.（方法）
    using TransferHelper for address;

    address public immutable token;
    bytes32 public merkleRoot;
    mapping(uint256 => mapping(address => bool)) claimedState;

    event DistributedReward(
        bytes32 indexed merkleRoot,
        uint256 indexed index,
        uint256 amount,
        uint256 settleBlockNumber
    );

    event Claimed(address indexed pool, address indexed user, uint256 indexed amount);

    struct MerkleDistributor {
        bytes32 merkleRoot;
        uint256 index;
        uint256 amount;
        uint256 settleBlockNumber;
    }
    MerkleDistributor[] public merkleDistributors;

    mapping(uint256 => uint256) private claimedBitMap;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not authorized");
        _;
    }

    constructor(address _token) {
        token = _token;
        owner = msg.sender;
    }

    function distributeReward(
        // 第几期，从第0期开始
        uint256 _index,
        uint256 _amount,
        uint256 _settleBlockNumber,
        bytes32 _merkleRoot
    ) external onlyOwner {
        merkleRoot = _merkleRoot;
        require(_index == merkleDistributors.length, "index already exist");

        uint256 currAmount = IERC20(token).balanceOf(address(this));
        require(currAmount >= _amount, "Insufficient reward");

        require(block.number >= _settleBlockNumber, "blockNumber dosen't exist");

        if (merkleDistributors.length > 0) {
            MerkleDistributor memory md = merkleDistributors[merkleDistributors.length - 1];
            // 保证处理下一期开奖的区块数大于上一期
            require(md.settleBlockNumber < _settleBlockNumber, "blockNumber dosen't exist");
        }

        merkleDistributors.push(
            MerkleDistributor(_merkleRoot, _index, _amount, _settleBlockNumber)
        );

        emit DistributedReward(_merkleRoot, _index, _amount, _settleBlockNumber);
    }

    function claim(uint256 index, uint256 amount, bytes32[] calldata proof) external {
        address user = msg.sender;
        require(merkleDistributors.length > index, "Invalid index");
        require(!isClaimed(index, user), "Drop already claimed");

        MerkleDistributor storage merkleDistributor = merkleDistributors[index];
        require(merkleDistributor.amount >= amount, "Insufficient amount");
        bytes32 leaf = keccak256(abi.encodePacked(index, user, amount));

        require(MerkleProof.verify(proof, merkleDistributor.merkleRoot, leaf), "Invalid proof");

        merkleDistributor.amount -= amount;
        claimedState[index][user] = true;
        address(token).safeTransfer(msg.sender, amount);

        emit Claimed(address(this), user, amount);
    }

    function isClaimed(uint256 index, address user) public view returns (bool) {
        return claimedState[index][user];
    }

    function claimRestTokens(address to) public returns (bool) {
        require(msg.sender == owner);
        require(IERC20(token).balanceOf(address(this)) >= 0);
        require(IERC20(token).transfer(to, IERC20(token).balanceOf(address(this))));
        return true;
    }
}
