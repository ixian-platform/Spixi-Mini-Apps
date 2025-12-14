// Copyright (C) 2026 IXI Labs
// This file is part of Spixi Mini Apps SDK - https://github.com/ixian-platform/Spixi-Mini-Apps
//
// Spixi Mini Apps SDK is free software: you can redistribute it and/or modify
// it under the terms of the MIT License as published
// by the Open Source Initiative.
//
// Spixi Mini Apps SDK is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// MIT License for more details.

// Spixi Mini Mini Apps SDK

// Command code constants for backend communication
const SPX_CMD_NETWORK_DATA = "ds";
const SPX_CMD_GET_STORAGE = "getStorage";
const SPX_CMD_SET_STORAGE = "setStorage";
const SPX_CMD_SEND_PAYMENT = "sendPayment";

var SpixiAppSdk = {
    version: 0.5,
    date: "2025-12-13",
    _requestId: 0,
    _pendingRequests: {},

    /**
     * Notifies the backend that the app has loaded.
     * Triggers the 'onload' event with the current SDK version.
     */
    fireOnLoad: function () { setTimeout(function() { location.href = "ixian:onload:" + SpixiAppSdk.version; }, 0); },

    /**
     * Requests the backend to navigate back or close the app.
     */
    back: function () { setTimeout(function() { location.href = "ixian:back"; }, 0); },

    /**
     * Sends data to the all remote addresses, optionally to a specific recipient.
     * @param {string} data - Data to send
     * @param {string|null} recipientAddress - Optional recipient address
     */
    sendNetworkData: function (data, recipientAddress = null) {
        var obj = { c: SPX_CMD_NETWORK_DATA, d: data };
        if (recipientAddress) {
            obj.r = recipientAddress;
        }
        SpixiAppSdk.spixiAction(obj, false);
    },
    
    /**
     * Sends protocol-specific data to all remote addresses, optionally to a specific recipient.
     * @param {string} protocolId - Protocol identifier
     * @param {string} data - Data to send
     * @param {string|null} recipientAddress - Optional recipient address
     */
    sendNetworkProtocolData: function (protocolId, data, recipientAddress = null) {
        var obj = { c: SPX_CMD_NETWORK_DATA, pid: protocolId, d: data };
        if (recipientAddress) {
            obj.r = recipientAddress;
        }
        SpixiAppSdk.spixiAction(obj, false);
    },

    /**
     * Retrieves a value from persistent storage.
     * @param {string} table - Storage table name
     * @param {string} key - Key to retrieve
     * @returns {Promise<string|null>} - Decoded value or null if not found
     */
    getStorageData: async function (table, key) {
        const resp = await SpixiAppSdk.spixiAction({ c: SPX_CMD_GET_STORAGE, t: table, k: key }, true);
        if (resp != "null")
        {
            return atob(resp);
        }
        return null;
    },
    /**
     * Stores a value in persistent storage.
     * @param {string} table - Storage table name
     * @param {string} key - Key to set
     * @param {string} value - Value to store
     * @returns {Promise|undefined}
     */
    setStorageData: function (table, key, value) {
        return SpixiAppSdk.spixiAction({ c: SPX_CMD_SET_STORAGE, t: table, k: key, v: btoa(value) }, true);
    },

    /**
     * Sends a payment to a recipient.
     * @param {string} recipientAddress - Address to send payment to
     * @param {number|string} amount - Amount to send
     * @returns {Promise<object>} - Payment result object
     */
    sendPayment: async function (recipientAddress, amount) {
        var data = {
            c: SPX_CMD_SEND_PAYMENT,
            recipients: { }
        };
        data.recipients[recipientAddress] = amount;
        return JSON.parse(await SpixiAppSdk.spixiAction(data, true));
    },

    /**
     * Sends an action to the backend. If useRequestId is true, returns a promise that resolves when .ar() is called with the response.
     * @param {object} actionData - The action data object to send
     * @param {boolean} useRequestId - Whether to include requestId and await response
     * @returns {Promise|undefined}
     */
    spixiAction: function (actionData, useRequestId = true) {
        if (typeof actionData !== 'object') {
            throw new Error('actionData must be an object');
        }
        let reqId = null;
        let promise;
        if (useRequestId) {
            reqId = ++SpixiAppSdk._requestId;
            actionData.id = reqId;
            promise = new Promise(function(resolve, reject) {
                SpixiAppSdk._pendingRequests[reqId] = { resolve, reject };
            });
        }
        // Serialize and encode actionData
        let json = JSON.stringify(actionData);
        let b64 = btoa(json);
        setTimeout(function() {
            location.href = "xa:" + b64;
        }, 0);
        return promise;
    },

    /**
     * !! INTERNAL !!
     * Handles responses from the backend for actions sent with a requestId.
     * Resolves the corresponding promise with the response data.
     * @param {string|object} actionResponse - JSON string or object containing at least an id
     */
    ar: function (actionResponse) {
        try {
            let resp = (typeof actionResponse === 'string') ? JSON.parse(actionResponse) : actionResponse;
            let reqId = resp.id;
            if (reqId && SpixiAppSdk._pendingRequests[reqId]) {
                SpixiAppSdk._pendingRequests[reqId].resolve(resp.r);
                delete SpixiAppSdk._pendingRequests[reqId];
            }
        } catch (e) {
            console.error('SpixiAppSdk.ar error:', e);
        }
    },

    // on* handlers should be overridden by the app

    /**
     * Called when the backend is initialized, after fireOnLoad.
     * @param {string} sessionId - Session identifier
     * @param {string} userAddress - User's address
     * @param {...string} remoteAddresses - Remote participant addresses
     */
    onInit: function (sessionId, userAddress, ...remoteAddresses) { /*alert("Received init with sessionId: " + sessionId + " and userAddress: " + userAddress);*/ },

    /**
     * Called when network data is received.
     * @param {string} senderAddress - Sender's address
     * @param {string} data - Data received
     */
    onNetworkData: function (senderAddress, data) { /*alert("Received network data from " + senderAddress + ": " + data);*/ },

    /**
     * Called when protocol-specific network data is received.
     * @param {string} senderAddress - Sender's address
     * @param {string} protocolId - Protocol identifier
     * @param {string} data - Data received
     */
    onNetworkProtocolData: function (senderAddress, protocolId, data) { /*alert("Received network app protocol data from " + senderAddress + " - " + protocolId + ": " + data);*/ },

    /**
     * Called when a request is accepted by the backend or another user.
     * @param {string} data - Data associated with the acceptance
     */
    onRequestAccept: function (data) { /*alert("Received request accept: " + data);*/ },

    /**
     * Called when a request is rejected by the backend or another user.
     * @param {string} data - Data associated with the rejection
     */
    onRequestReject: function (data) { /*alert("Received request reject: " + data);*/ },

    /**
     * Called when the app session is ended by the backend.
     * @param {string} data - Data associated with the session end
     */
    onAppEndSession: function (data) { /*alert("Received app end session: " + data);*/ },

    /**
     * Called when a transaction is received.
     * @param {string} senderAddress - Sender's address
     * @param {number|string} amount - Amount received
     * @param {string} txid - Transaction ID
     * @param {string} data - Additional data
     * @param {boolean} verified - Whether the transaction is verified
     */
    onTransactionReceived: function (senderAddress, amount, txid, data, verified) { /*alert("Received transaction from " + senderAddress + ": " + amount + " " + txid + " " + data + " " + verified);*/ },

    /**
     * Called when a payment is sent.
     * @param {string} recipientAddress - Recipient's address
     * @param {number|string} amount - Amount sent
     * @param {string} txid - Transaction ID
     * @param {string} data - Additional data
     * @param {boolean} verified - Whether the payment is verified
     */
    onPaymentSent: function (recipientAddress, amount, txid, data, verified) { /*alert("Sent payment from " + recipientAddress + ": " + amount + " " + txid + " " + data + " " + verified);*/ },
};
