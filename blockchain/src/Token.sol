// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin-contracts-5.0.2/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint8 private _decimals;
    constructor(string memory name, string memory ticker, uint initialBalance, uint8 __decimals) ERC20(name, ticker) {
        _mint(msg.sender, initialBalance);
        _decimals = __decimals;
    }

    function decimals() public view override returns(uint8) {
        return _decimals;
    }
}