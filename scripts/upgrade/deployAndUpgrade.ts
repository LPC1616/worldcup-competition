import { ethers, upgrades } from "hardhat";

async function main(){
    const TWO_WEEKS_IN_SECS = 14 * 24 * 60 * 60;
    const timestamp = Math.floor(Date.now()/1000);
    const deadline = timestamp + TWO_WEEKS_IN_SECS;
    console.log(timestamp);

    // Deploying
    const WorldCupV1 = await ethers.getContractFactory("WorldCupV1");
    const instance = await upgrades.deployProxy(WorldCupV1,[deadline]);
    await instance.deployed();
    console.log("WorldCupV1",instance.address);
    console.log("deadline1:", instance.deadline());

    console.log('ready to upgrade to v2');

    // upgrade
    const WorldCupV2 = await ethers.getContractFactory("WorldCupV2");
    const upgraded = await upgrades.upgradeProxy(instance.address, WorldCupV2);
    console.log("WorldCupV2:", upgraded.address);

    await upgraded.changeDeadline(deadline+100);
    console.log("deadline2:", upgraded.deadline());
}

main();