// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthCheckLog {
    event CheckRecorded(address indexed subject, bool healthy, uint256 value, uint256 timestamp);

    function recordCheck(address subject, bool healthy, uint256 value) external {
        emit CheckRecorded(subject, healthy, value, block.timestamp);
    }
}
