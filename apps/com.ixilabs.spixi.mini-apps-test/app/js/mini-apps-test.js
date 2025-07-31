// Copyright (C) 2025 IXI Labs
// This file is part of Ixian Core - https://github.com/ixian-platform/Spixi-Mini-Apps
//
// Ixian Core is free software: you can redistribute it and/or modify
// it under the terms of the MIT License as published
// by the Open Source Initiative.
//
// Ixian Core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// MIT License for more details.

var protocolId = "com.ixilabs.spixi.mini-apps-test";

function storageDataTest() {
    var onStorageData1 = function (key, val) {
        if (key != "testKey") {
            alert("Storage key is '" + key + "', expecting 'testKey' ");
        }
        val = atob(val);
        if (val != "testValue") {
            alert("Storage value is '" + val + "', expecting 'testValue' ");
        }

        var onStorageData2 = function (key, val) {
            if (key != "testKey") {
                alert("Storage key is '" + key + "', expecting 'testKey' ");
            }
            val = atob(val);
            if (val != "testValue2") {
                alert("Storage value is '" + val + "', expecting 'testValue2' ");
            }

            var onStorageData3 = function (key, val) {
                if (key != "testKey3") {
                    alert("Storage key is '" + key + "', expecting 'testKey3' ");
                }
                val = atob(val);
                if (val != "testValue3") {
                    alert("Storage value is '" + val + "', expecting 'testValue3' ");
                }

                var onStorageData4 = function (key, val) {
                    if (key != "testKey") {
                        alert("Storage key is '" + key + "', expecting 'testKey' ");
                    }
                    if (val != 'null') {
                        alert("Storage value is '" + val + "', expecting 'null' ");
                    }

                    alert("All tests have passed.");
                };
                setDataKey("testKey", null, onStorageData4)
            };
            setDataKey("testKey3", "testValue3", onStorageData3)
        };
        setDataKey("testKey", "testValue2", onStorageData2)
    };
    setDataKey("testKey", "testValue", onStorageData1)
}

function setDataKey(key, value, onStorageData) {
    if (value != null) {
        value = btoa(value);
    }
    SpixiAppSdk.setStorageData(key, value);
    if (onStorageData == undefined) {
        onStorageData = function (key, value) {
            appSdkDataReceived("onStorageData", key + "=" + atob(value));
        };
    }
    setTimeout(function () {
        SpixiAppSdk.onStorageData = onStorageData;
        SpixiAppSdk.getStorageData(key);
    }, 0);
}

function getDataKey(key) {

    SpixiAppSdk.setStorageData("testKey", null);
    SpixiAppSdk.onStorageData = function (key, value) {
        appSdkDataReceived("onStorageData", key + "=" + atob(value));
    };
    SpixiAppSdk.getStorageData(key);
}

function appSdkDataReceived(type, data) {
    document.getElementById("miniAppsTestOutput").innerHTML += type + ": " + data + "<br/>";
}

function sendNetworkProtocolData(data) {
    SpixiAppSdk.sendNetworkProtocolData(protocolId, data);
}


SpixiAppSdk.onStorageData = function (key, value) { appSdkDataReceived("onStorageData", key + "=" + value); };
SpixiAppSdk.onNetworkData = function (senderAddress, data) { appSdkDataReceived("onNetworkData", senderAddress + "=" + data); };
SpixiAppSdk.onNetworkProtocolData = function (senderAddress, protocolId, data) { appSdkDataReceived("onNetworkProtocolData", senderAddress + "=" + protocolId + ":" + data); };
SpixiAppSdk.onRequestAccept = function (data) { appSdkDataReceived("onRequestAccept", data); };
SpixiAppSdk.onRequestReject = function (data) { appSdkDataReceived("onRequestReject", data); };
SpixiAppSdk.onAppEndSession = function (data) { appSdkDataReceived("onAppEndSession", data); };