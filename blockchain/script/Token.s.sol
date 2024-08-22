// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Token} from "../src/Token.sol";

contract TokenScript is Script {
    Token public usdt;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        usdt = new Token("Tether", "USDT", 1000 * 10 ** 6, 6);

        vm.stopBroadcast();
    }
}