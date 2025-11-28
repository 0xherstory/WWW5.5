// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ExpenseTracker
 * @dev 去中心化记账索引合约 - 存储用户的 IPFS CID 列表
 * 核心理念："数据在下(IPFS)，目录在上(链上)"
 */
contract ExpenseTracker {

    // 记录结构体：包含 CID 和时间戳
    struct Record {
        string cid;           // IPFS 内容标识符
        uint256 timestamp;    // 记录创建时间
    }

    // 用户地址 => 记录数组
    mapping(address => Record[]) private userRecords;

    // 事件：当新记录被添加时触发
    event RecordAdded(
        address indexed user,
        string cid,
        uint256 timestamp,
        uint256 recordIndex
    );

    /**
     * @dev 添加一条新记录
     * @param _cid IPFS 返回的内容标识符（加密数据的哈希）
     */
    function addRecord(string memory _cid) external {
        require(bytes(_cid).length > 0, "CID cannot be empty");

        // 创建新记录
        Record memory newRecord = Record({
            cid: _cid,
            timestamp: block.timestamp
        });

        // 添加到用户的记录数组
        userRecords[msg.sender].push(newRecord);

        // 触发事件（前端可以监听）
        emit RecordAdded(
            msg.sender,
            _cid,
            block.timestamp,
            userRecords[msg.sender].length - 1
        );
    }

    /**
     * @dev 获取指定用户的所有记录
     * @param _user 用户钱包地址
     * @return Record[] 该用户的所有记录数组
     */
    function getRecords(address _user) external view returns (Record[] memory) {
        return userRecords[_user];
    }

    /**
     * @dev 获取指定用户的记录数量
     * @param _user 用户钱包地址
     * @return uint256 记录总数
     */
    function getRecordCount(address _user) external view returns (uint256) {
        return userRecords[_user].length;
    }

    /**
     * @dev 获取用户的单条记录
     * @param _user 用户钱包地址
     * @param _index 记录索引
     * @return Record 指定的记录
     */
    function getRecordByIndex(address _user, uint256 _index)
        external
        view
        returns (Record memory)
    {
        require(_index < userRecords[_user].length, "Index out of bounds");
        return userRecords[_user][_index];
    }
}
