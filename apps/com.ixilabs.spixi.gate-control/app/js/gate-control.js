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


class GateControlApp {
    constructor(protocolId = "com.ixilabs.gatecontrol", pingInterval = 5000) {
        this.protocolId = protocolId;
        this.pingInterval = pingInterval;
        this.pingTimer = null;

        // State holds reactive data
        this.state = {
            status: '',
            cameraSrc: ''
        };

        // DOM elements
        this.statusEl = null;
        this.cameraEl = null;
        this.openBtn = null;
        this.closeBtn = null;
        this.backBtn = null;
    }

    set status(text) {
        this.state.status = text;
        if (this.statusEl) this.statusEl.innerText = `Status: ${text}`;
    }

    set cameraSrc(src) {
        this.state.cameraSrc = src;
        if (this.cameraEl) this.cameraEl.src = src;
    }

    initElements = () => {
        this.statusEl = document.getElementById("status");
        this.cameraEl = document.getElementById("cameraFeed");
        this.toggleBtn = document.getElementById("toggleGateBtn");
        this.backBtn = document.getElementById("backBtn");
    };

    setupControls = () => {
        this.toggleBtn?.addEventListener("click", () => {
            SpixiAppSdk.sendNetworkProtocolData(this.protocolId, JSON.stringify({ action: "toggle" }));
            this.status = "Toggling gate...";
        });

        this.backBtn?.addEventListener("click", () => SpixiAppSdk.back());
    };

    setupCameraFeedListener = () => {
        SpixiAppSdk.onNetworkProtocolData = (senderAddress, receivedProtocolId, data) => {
            if (receivedProtocolId !== this.protocolId) return;

            try {
                const msg = JSON.parse(data);

                if (msg.imageBase64) {
                    this.cameraSrc = `data:image/jpeg;base64,${msg.imageBase64}`;
                    this.status = "Camera feed updated";
                } else if (msg.status) {
                    this.status = msg.status;
                }
            } catch (err) {
                console.error("Error parsing protocol data:", err);
            }
        };
    };

    pingQuIXI = () => {
        const timestamp = SpixiTools.getTimestamp();
        SpixiAppSdk.sendNetworkProtocolData(this.protocolId, JSON.stringify({ action: "ping", ts: timestamp }));
        this.status = "Pinging QuIXI...";
    };

    startPinging = () => {
        if (!this.pingTimer) {
            this.pingQuIXI();
            this.pingTimer = setInterval(this.pingQuIXI, this.pingInterval);
        }
    };

    stopPinging = () => {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
            this.status = "Ping paused (app hidden)";
        }
    };

    handleVisibilityChange = () => {
        document.hidden ? this.stopPinging() : this.startPinging();
    };

    onInit = (sessionId, userAddress, ...remoteAddresses) => {
        console.log("App initialized. Session:", sessionId, "User:", userAddress, "Remote:", remoteAddresses);

        this.initElements();
        this.setupControls();
        this.setupCameraFeedListener();

        this.startPinging();
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    };

    destroy = () => {
        this.stopPinging();
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    };
}

SpixiAppSdk.onInit = (sessionId, userAddress, ...remoteAddresses) => {
    const gateControlApp = new GateControlApp();
    gateControlApp.onInit(sessionId, userAddress, remoteAddresses);
};

window.onload = SpixiAppSdk.fireOnLoad;
