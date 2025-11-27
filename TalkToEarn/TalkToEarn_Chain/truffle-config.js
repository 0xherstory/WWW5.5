module.exports = {
  networks: {
    development: {
    host: "127.0.0.1",
  port: 7545,
  network_id: "*",
  gas: 6700000,
  gasPrice: 20000000000, // 20 gwei
  // 加上这两行，让 Truffle 自动发 type 2 交易
  maxFeePerGas: 100000000000,   // 100 gwei
  priorityFeePerGas: 1000000000 // 1 gwei
},
  },
  compilers: {
    solc: {
      version: "0.8.19",  // 确保使用正确的合约编译器版本
    },
  },
};
