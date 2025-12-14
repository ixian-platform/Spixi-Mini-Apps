// Copyright (C) 2025 IXI Labs
// This file is part of Spixi Mini App Examples - https://github.com/ixian-platform/Spixi-Mini-Apps
//
// Spixi is free software: you can redistribute it and/or modify
// it under the terms of the MIT License as published
// by the Open Source Initiative.
//
// Spixi is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// MIT License for more details.

var protocolId = "com.ixilabs.spixi.mini-apps-test";
var appSessionId = "";
var remotePlayers = [];

async function storageDataTest() {
    let testValues = [
        { table: 'main', key: "testKey", value: "testValue" },        
        { table: 'main', key: "testKey", value: "testValue2" },
        { table: 'test', key: "testKey", value: "testValue" },   
        { table: 'main', key: "testKey3", value: "testValue3" },
        { table: 'main', key: "testKey", value: "null" }
    ];

    for (var i in testValues) {
        let test = testValues[i];
        await SpixiAppSdk.setStorageData(test.table, test.key, test.value);
        let retrievedValue = await SpixiAppSdk.getStorageData(test.table, test.key);
        if (retrievedValue != test.value) {
            alert(`Storage test failed for table='${test.table}', key='${test.key}'. Expected '${test.value}', got '${retrievedValue}'`);
            return;
        }

    }

    alert("All tests have passed.");
}

function appSdkDataReceived(type, data) {
    document.getElementById("miniAppsTestOutput").innerHTML += type + ": " + data + "<br/>";
}

function sendNetworkProtocolData(data) {
    SpixiAppSdk.sendNetworkProtocolData(protocolId, data);
}

SpixiAppSdk.onInit = function (sessionId, userAddress, ...remoteAddresses) {
    appSessionId = sessionId;
    remotePlayers = remoteAddresses;
    appSdkDataReceived("onInit", sessionId + " " + userAddress + " " + remoteAddresses.join(", "));
    document.getElementById("sendTransactionBtn").innerHTML = "Send 1 IXI to " + remotePlayers[0];
}
SpixiAppSdk.onNetworkData = function (senderAddress, data) { appSdkDataReceived("onNetworkData", senderAddress + "=" + data); };
SpixiAppSdk.onNetworkProtocolData = function (senderAddress, protocolId, data) { appSdkDataReceived("onNetworkProtocolData", senderAddress + "=" + protocolId + ":" + data); };
SpixiAppSdk.onRequestAccept = function (data) { appSdkDataReceived("onRequestAccept", data); };
SpixiAppSdk.onRequestReject = function (data) { appSdkDataReceived("onRequestReject", data); };
SpixiAppSdk.onAppEndSession = function (data) { appSdkDataReceived("onAppEndSession", data); };
SpixiAppSdk.onTransactionReceived = function (senderAddress, amount, txid, data, verified) { appSdkDataReceived("onTransactionReceived", senderAddress + ": " + amount + " " + txid + " " + data + " " + verified); };
SpixiAppSdk.onPaymentSent = function (recipientAddress, amount, txid, data, verified) { appSdkDataReceived("onPaymentSent", recipientAddress + ": " + amount + " " + txid + " " + data + " " + verified); };

window.onload = SpixiAppSdk.fireOnLoad;
