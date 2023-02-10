import { ethers } from "hardhat";

async function main() {
  const TWO_WEEKS_IN_SECS = 14 * 24 * 60 * 60;
  const timestamp = Math.floor(Date.now()/1000);
  const deadline = timestamp + TWO_WEEKS_IN_SECS;
  console.log(timestamp);

  // 获取对象
  const WorldCup = await ethers.getContractFactory("WorldCup");
  // 部署
  const worldcup = await WorldCup.deploy(deadline);
  // 等待部署完成
  await worldcup.deployed();

  // 得用反引号 ` ,这样worldcup.address才能正常输出。不能用单引号 '
  console.log(`new worldcup was deployed to ${worldcup.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
