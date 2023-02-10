## 世界杯竞猜 DApp

### 前言

我是LPC，一枚C2院校的研究生，这是我在2022世界杯期间写的一个世界杯竞猜的Demo，未来会持续更新，欢迎关注~~~

我的账户地址是：0xD41151Fdb7BC2350A45317E1643CcC9E3380E973（欢迎资助，测试币也行~~）

前端地址：待发布

### 项目介绍

世界杯竞猜项目，一个运行在goerli测试网的DApp。

- 整个工程化管理使用的是 **hardhat** 框架，在框架中实现了合约的编译、部署、verify（该过程由于国内网络问题可能无法通过脚本自动验证，后面会提到）、单元测试等。
- 技术栈：**react** + **hardhat** + **ethers.js** + **Subgraph**
- 智能合约使用的是 **Solidity** 语言，合约是整个DApp的核心部分。
- worldcup合约地址0x644E5b13B02b3cB1948c27bf28e9649b48F22c00 [预览](https://goerli.etherscan.io/address/0x644E5b13B02b3cB1948c27bf28e9649b48F22c00#code)

### 项目特点

- 升级合约，实现了数据和逻辑的分离，便于后期修复合约可能出现的bug和进行程序功能的拓展。

### 部署与验证

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

验证需翻墙，且需开启**增强代理模式**，或使用**remix**里的verify插件（仅对在remix里部署的合约有用，不知道为啥），亦或在etherscan里手动验证。

### 未来计划

- 使用subgraph监听链下时间，供前端调用
