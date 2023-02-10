import {ethers} from "hardhat";

async function main(){
    let token = "0x9B898dF8D1419302a43a6F40Ac8Fb39434d32b41";

    const Distributor = await ethers.getContractFactory("WorldCupDistributor");
    const distributor = await Distributor.deploy(token);

    await distributor.deployed();

    console.log(`new distributor :${distributor.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });