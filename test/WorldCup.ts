import {time, loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {expect} from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import { WorldCup } from "../typechain-types";

describe("worldCup",function(){
    enum Country {
        GERMANY,
        FRANCH,
        CHINA,
        BRIZAL,
        KOREA
    }

    const TWO_WEEKS_IN_SECS = 14 * 24 * 60 * 60;
    const ONE_GWAI = 1_000_000_000;
    const ONE_ETHER = ethers.utils.parseEther("1");

    let worldcupIns:WorldCup
    let ownerAddr:string
    let otherAccountAddr:string
    let deadline1:number

    async function deployWorldCupFixture (){
        // 获取第一个钱包对象，用于发起交易
        const [owner, otherAccount] = await ethers.getSigners();

        // 获取合约对象
        const WorldCup = await ethers.getContractFactory("WorldCup");
        const deadline = (await time.latest()) + TWO_WEEKS_IN_SECS;
        const worldcup = await WorldCup.deploy(deadline);

        return { worldcup, deadline, owner, otherAccount };
    }

    this.beforeEach(async ()=>{
        // 从内存中获取合约状态快照，确保在执行每个单元测试之前，合约的状态都会回到最初
        const {worldcup, deadline, owner, otherAccount} = await loadFixture(deployWorldCupFixture);

        worldcupIns = worldcup;
        deadline1 = deadline;
        ownerAddr = owner.address;
        otherAccountAddr = otherAccount.address;
    })

    let preparePlay = async () => {
        const [A,B,C,D] = await ethers.getSigners();
        await worldcupIns.connect(A).play(Country.GERMANY, {value: ONE_GWAI});
        await worldcupIns.connect(B).play(Country.GERMANY, {value: ONE_GWAI});
        await worldcupIns.connect(C).play(Country.GERMANY, {value: ONE_GWAI});
        await worldcupIns.connect(D).play(Country.FRANCH, {value: ONE_GWAI});
    }

    describe("Deployment", function(){
        // 检查deadline设置是否成功
        it("Should set the right deadline", async function () {
            console.log('deadline:', deadline1)

            expect(await worldcupIns.deadline()).to.equal(deadline1);
        });

        it("Should set the right owner", async function () {
            expect(await worldcupIns.admin()).to.equal(ownerAddr);
        });

        it("Should fail if the deadline is not in the future", async function(){
            const latestTime = await time.latest();
            const WorldCup = await ethers.getContractFactory("WorldCup");
            await expect(WorldCup.deploy(latestTime)).to.be.revertedWith("WorldCupLottery: invalid deadline");
        });
    });

    describe("Play", function(){
        it("Should deposit 1 gwei", async function(){
            await worldcupIns.play(Country.CHINA, {value: ONE_GWAI});

            let bal = await worldcupIns.getVaultBalance();
            console.log("bal:", bal);
            console.log("bal.toString()", bal.toString());

            expect(bal).to.equal(ONE_GWAI);
        });

        it("Should fail with invalid eth",async function(){
            await expect(worldcupIns.play(Country.BRIZAL,{value:ONE_GWAI * 2})).to.revertedWith("invalid funds provided");
        });

        it("Should have 1 player for selected country", async function (){
            await expect(worldcupIns.play(10, {value: ONE_GWAI})).to.revertedWithoutReason();
        });

        it("Should emit Event Play", async function(){
            await expect(worldcupIns.play(Country.BRIZAL,{value: ONE_GWAI})).to.emit(worldcupIns,"Play").withArgs(0,ownerAddr,Country.BRIZAL);
        });
    });

    describe("Finalize",function(){
        it("Should failed when called by other account", async function(){
            let otherAccount = await ethers.getSigner(otherAccountAddr);

            await expect(worldcupIns.connect(otherAccount).finalize(Country.BRIZAL)).to.revertedWith("not authorized");
        });

        it("Should distibute with the correct reward", async function (){
            const [A,B,C,D] = await ethers.getSigners();
            await preparePlay();

            await worldcupIns.finalize(Country.GERMANY);

            // 校验数据
            let rewardForA = await worldcupIns.winnerVaults(A.address);
            let rewardForB = await worldcupIns.winnerVaults(B.address);
            let rewardForC = await worldcupIns.winnerVaults(C.address);
            let rewardForD = await worldcupIns.winnerVaults(D.address);

            expect(rewardForA).to.equal(ethers.BigNumber.from(1333333334));
            expect(rewardForB).to.equal(ethers.BigNumber.from(1333333333));
            expect(rewardForC).to.equal(ethers.BigNumber.from(1333333333));
            expect(rewardForD).to.equal(ethers.BigNumber.from(0));
        });

        it("Should emit Finalize Event", async function (){
            const [A,B,C,D] = await ethers.getSigners();
            await preparePlay();

            let winners = [A.address,B.address,C.address];

            await expect(worldcupIns.finalize(Country.GERMANY)).to.emit(worldcupIns,"Finalize").withArgs(0,0);
        });
    });

    describe("ClaimReward", function(){
        it("Should fail if the claimer has no reward", async function(){
            await expect(worldcupIns.claimReward()).revertedWith("nothing to claim");
        });

        it("Should clear the reward after claim", async function(){
            const [A,B,C,D] = await ethers.getSigners();
            await preparePlay();

            await worldcupIns.finalize(Country.GERMANY);

            // data before claim
            let balBefore_A = await ethers.provider.getBalance(A.address);
            let balBefore_WC = await worldcupIns.getVaultBalance();
            let balBefore_lockedAmts = await worldcupIns.lockedAmts();

            console.log("balBefore_A:", balBefore_A.toString());
            console.log("balBefore_WC:", balBefore_WC.toString());
            console.log("balBefore_lockedAmts:", balBefore_lockedAmts.toString());

            //claim
            let rewardForA = await worldcupIns.winnerVaults(A.address);
            await worldcupIns.connect(A).claimReward();

            // data after claim
            let balAfter_A = await ethers.provider.getBalance(A.address);
            let balAfter_WC = await worldcupIns.getVaultBalance();
            let balAfter_lockedAmts = await worldcupIns.lockedAmts();

            console.log("balAfter_A:", balAfter_A.toString());
            console.log("balAfter_WC:", balAfter_WC.toString());
            console.log("balAfter_lockedAmts:", balAfter_lockedAmts.toString());

            expect(balBefore_WC.sub(balAfter_WC)).to.equal(rewardForA);
            expect(balBefore_lockedAmts.sub(balAfter_lockedAmts)).to.equal(rewardForA);
        });
    });
})