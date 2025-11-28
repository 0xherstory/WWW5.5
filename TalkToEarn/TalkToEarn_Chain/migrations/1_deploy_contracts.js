// migrations/1_deploy_contracts.js
const NFTContract = artifacts.require("SimpleNFT");
const RewardContract = artifacts.require("RewardContract");

module.exports = async function (deployer) {
  // 部署 NFT 合约
  await deployer.deploy(NFTContract, "AI Knowledge NFT", "AIKNFT");
  const nftInstance = await NFTContract.deployed();
  console.log("NFTContract 部署成功，地址:", nftInstance.address);

  // 部署 Reward 合约（构造函数需要一个 uint256 参数）
  const chatFee = web3.utils.toWei("0.000001", "ether");
  await deployer.deploy(RewardContract, chatFee);
  const rewardInstance = await RewardContract.deployed();
  console.log("RewardContract 部署成功，地址:", rewardInstance.address);

  // 可选：保存地址到文件（方便前端读取）
  const fs = require('fs');
  const addresses = {
    NFTContract: nftInstance.address,
    RewardContract: rewardInstance.address
  };
  fs.writeFileSync("contract_addresses.json", JSON.stringify(addresses, null, 2));
  console.log("合约地址已保存到 contract_addresses.json");
};