// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";

// 0x644E5b13B02b3cB1948c27bf28e9649b48F22c00
contract WorldCup {
    address public admin;
    uint8 public currRound;

    string[] public countries = ["GERMANY", "FRANCH", "CHINA", "BRIZAL", "KOREA"];
    mapping(uint8 => mapping(address => Player)) players;
    mapping(uint8 => mapping(Country => address[])) public countryToPlayers;
    mapping(address => uint256) public winnerVaults;

    uint256 public immutable deadline;
    // 锁在合约里待认领的奖金
    uint256 public lockedAmts;

    enum Country {
        GERMANY,
        FRANCH,
        CHINA,
        BRIZAL,
        KOREA
    }

    struct Player {
        bool isSet;
        mapping(Country => uint256) counts;
    }

    //定义事件
    event Play(uint8 _currRound, address _player, Country _country);
    event Finalize(uint8 _currRound, uint256 _country);
    event ClaimReward(address _claimer, uint256 _amt);

    //定义修饰符，只能管理员操作
    modifier onlyAdmin() {
        require(msg.sender == admin, "not authorized");
        _;
    }

    constructor(uint256 _deadline) {
        admin = msg.sender;
        require(_deadline > block.timestamp, "WorldCupLottery: invalid deadline");
        deadline = _deadline;
    }

    function play(Country _selected) external payable {
        // 检查竞猜费用
        require(msg.value == 1 gwei, "invalid funds provided");
        // 检查参与竞猜的时间
        require(block.timestamp < deadline, "it's over");

        // 更新countryToPlayers
        countryToPlayers[currRound][_selected].push(msg.sender);

        // 更新players
        Player storage player = players[currRound][msg.sender];
        player.counts[_selected] += 1;

        emit Play(currRound, msg.sender, _selected);
    }

    function finalize(Country _country) external onlyAdmin {
        // 找到winner
        address[] memory winners = countryToPlayers[currRound][_country];
        uint256 distributeAmt;

        //分配奖金
        uint currAvalBalance = getVaultBalance() - lockedAmts;
        console.log("currAvalBalance:", currAvalBalance, "winner count", winners.length);

        for (uint i = 0; i < winners.length; i++) {
            address currWinner = winners[i];

            // 获取每个地址应得的份额
            Player storage winner = players[currRound][currWinner];
            if (winner.isSet) {
                console.log("this winner has been set already, will be skipped");
                continue;
            }

            winner.isSet = true;

            uint currCounts = winner.counts[_country];

            // 计算该获奖地址应获得的奖励 = （本期总奖励 / 总参与人数（可重复））* 当前地址持有的份额
            uint amt = (currAvalBalance / countryToPlayers[currRound][_country].length) *
                currCounts;

            winnerVaults[currWinner] += amt;
            distributeAmt += amt;
            lockedAmts += amt;

            console.log("winner:", currWinner, "currCounts:", currCounts);
            console.log("reward amt curr:", amt, "total", winnerVaults[currWinner]);
        }

        // 计算空投->分完奖金之后的零头
        uint giftAmt = currAvalBalance - distributeAmt;
        if (giftAmt > 0) {
            winnerVaults[admin] += giftAmt;
        }

        // 其中enum类型和uint256类型之间可以显式转换，并且会检查转换后的正整数是否在枚举的长度范围内，不然会报错
        emit Finalize(currRound++, uint256(_country));
    }

    // 用户调用此函数来获取奖金
    function claimReward() external {
        uint256 rewards = winnerVaults[msg.sender];
        require(rewards > 0, "nothing to claim");

        winnerVaults[msg.sender] = 0;
        lockedAmts -= rewards;
        (bool succeed, ) = msg.sender.call{value: rewards}("");
        require(succeed, "claim rewards failed");

        console.log("rewards:", rewards);

        emit ClaimReward(msg.sender, rewards);
    }

    function getVaultBalance() public view returns (uint256 bal) {
        bal = address(this).balance;
    }

    function getCountryPlayers(uint8 _round, Country _country) external view returns (uint256) {
        return countryToPlayers[_round][_country].length;
    }

    function getPlayerInfo(
        uint8 _round,
        address _player,
        Country _country
    ) external view returns (uint256 _counts) {
        return players[_round][_player].counts[_country];
    }
}
