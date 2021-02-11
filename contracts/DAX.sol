// Function that we need:
/*
    1. Constructor to setup the owner
    2. Fallback non-payable function to reject ETH from direct transfers since we only want people to use the functions designed to trade a specific pair
    3. Function to extract tokens from this contract in case someone mistakenly sends ERC20 to the wrong function
    4. Function to create whitelist a token by the owner
    5. Function to create market orders
    6. Function to create limit orders    

*/

pragma solidity ^0.5.4;

import './Escrow.sol';
