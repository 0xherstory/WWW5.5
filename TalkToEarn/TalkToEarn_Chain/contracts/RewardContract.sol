//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RewardContract {
    address public owner;
    uint256 public chatFee; // 每次对话费用（wei）
    
    struct Contribution {
        uint256 nftId;
        uint256 relevanceWeight; // 相关度权重（放大1000倍，如0.75存储为750）
    }
    
    event ChatPayment(address indexed user, uint256 amount, bytes32 conversationId);
    event RewardDistributed(uint256 indexed nftId, address indexed recipient, uint256 amount);
    
    constructor(uint256 _chatFee) {
        owner = msg.sender;
        chatFee = _chatFee; // 0.000001 ETH = 1000000000000 wei
    }
    
    // 支付对话费用
    function payForChat(bytes32 conversationId) external payable {
        require(msg.value >= chatFee, "Insufficient payment");
        emit ChatPayment(msg.sender, msg.value, conversationId);
    }
    
    // 分发奖励给内容提供者（由后端调用）
    function distributeRewards(
        Contribution[] calldata contributions,
        address[] calldata recipients
    ) external onlyOwner {
        require(contributions.length == recipients.length, "Array length mismatch");
        require(address(this).balance >= chatFee, "Insufficient contract balance");
        
        uint256 totalWeight = 0;
        for (uint i = 0; i < contributions.length; i++) {
            totalWeight += contributions[i].relevanceWeight;
        }
        
        require(totalWeight > 0, "Total weight is zero");
        
        for (uint i = 0; i < contributions.length; i++) {
            uint256 share = (chatFee * contributions[i].relevanceWeight) / totalWeight;
            if (share > 0 && recipients[i] != address(0)) {
                payable(recipients[i]).transfer(share);
                emit RewardDistributed(contributions[i].nftId, recipients[i], share);
            }
        }
    }
    
    // 提取ETH（仅所有者）
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // 修改对话费用（仅所有者）
    function setChatFee(uint256 _newFee) external onlyOwner {
        chatFee = _newFee;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    receive() external payable {}
    
    // 获取合约余额
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}