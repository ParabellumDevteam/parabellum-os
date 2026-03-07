// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PRBLToken.sol";
import "../src/PRBLRewardsDistributor.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(pk);

        // TOKEN PARAMS
        string memory name = "Parabellum";
        string memory symbol = "PRBL";
        uint8 dec = 9;

        // 777,777,777,777 * 10^9
        uint256 maxSupply = 777_777_777_777 * (10 ** uint256(dec));

        uint256 unlockTs = vm.envUint("UNLOCK_TS");

        vm.startBroadcast(pk);

        PRBLToken token = new PRBLToken(name, symbol, dec, maxSupply, unlockTs, admin);

        PRBLRewardsDistributor distributor = new PRBLRewardsDistributor(address(token));

        // Give distributor permission to mint
        token.grantRole(token.MINTER_ROLE(), address(distributor));

        vm.stopBroadcast();

        console2.log("TOKEN=", address(token));
        console2.log("DISTRIBUTOR=", address(distributor));
        console2.log("UNLOCK_TS=", unlockTs);
    }
}
