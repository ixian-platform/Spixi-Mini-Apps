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

class WhiteboardUITools {
    static getMousePos(e) {
        if (!e) {
            e = event;
        }

        const mouseX = e.offsetX ? e.offsetX : e.layerX;
        const mouseY = e.offsetY ? e.offsetY : e.layerY;

        return [mouseX, mouseY];
    }

    static getTouchPos(e) {
        if (!e) {
            e = event;
        }

        if (!e.touches) {
            return null;
        }

        // Make sure only one finger is used
        if (e.touches.length != 1) {
            return null;
        }

        const touch = e.touches[0];
        const touchX = touch.pageX - touch.target.offsetLeft;
        const touchY = touch.pageY - touch.target.offsetTop;

        return [touchX, touchY];
    }

    static drawDot(ctx, x, y, size, r, g, b) {
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 255)";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    static clearCanvas(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    static resizeCanvas(canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

class SpixiWhiteboard {
    canvas;
    ctx;

    mouseDown = 0;

    dataBatch = "";

    lastDataSent = 0;
    lastDataReceived = 0;

    pingInterval;
    dataDispatchInterval;

    constructor() {

    }

    init(canvasId) {
        this.prepareCanvas(canvasId);

        const t = this;

        document.getElementById("remoteUserPresenceIndicator").addEventListener('click', (e) => { t.reset(); SpixiAppSdk.sendNetworkData("reset"); }, false);

        this.pingInterval = setInterval(() => { t.ping(); }, 5000);

        this.dataDispatchInterval = setInterval(() => { t.sendDataBatch(); }, 200);
    }

    prepareCanvas(canvasId) {
        if (this.canvas) {
            throw new Error("Canvas already prepared.");
        }

        const canvas = document.getElementById(canvasId);
        this.canvas = canvas;

        if (canvas.getContext)
            this.ctx = canvas.getContext('2d');

        if (!this.ctx) {
            throw new Error("Cannot initialize context.");
        }

        WhiteboardUITools.resizeCanvas(canvas);

        const t = this;

        canvas.addEventListener('mousedown', (e) => { t.onMouseDown(e); }, false);
        canvas.addEventListener('mousemove', (e) => { t.onMouseMove(e); }, false);
        window.addEventListener('mouseup', (e) => { t.onMouseUp(e); }, false);

        canvas.addEventListener('touchstart', (e) => { t.onTouchStart(e); }, false);
        canvas.addEventListener('touchmove', (e) => { t.onTouchMove(e); }, false);
    }

    sendDataBatch() {
        if (this.dataBatch != "") {
            var tmpDataBatch = this.dataBatch;
            this.dataBatch = "";
            this.lastDataSent = SpixiTools.getTimestamp();
            SpixiAppSdk.sendNetworkData(tmpDataBatch);
        }
    }

    ping() {
        const currentTime = SpixiTools.getTimestamp();
        this.lastDataSent = currentTime;
        SpixiAppSdk.sendNetworkData("ping");

        if (currentTime - this.lastDataReceived < 10) {
            document.getElementById("remoteUserPresenceIndicator").style.display = "block";
        } else {
            document.getElementById("remoteUserPresenceIndicator").style.display = "none";
        }
    }

    onMouseDown(e) {
        this.mouseDown = 1;
        this.onMouseMove(e);
    }

    onMouseUp() {
        this.mouseDown = 0;
    }

    onMouseMove(e) {
        if (this.mouseDown == 1) {
            const mousePos = WhiteboardUITools.getMousePos(e);

            this.draw(mousePos[0], mousePos[1], 0);
            this.addPositionToBatch(mousePos[0] + "," + mousePos[1]);
        }
    }

    onTouchStart(e) {
        this.onTouchMove(e);
    }

    onTouchMove(e) {
        const touchPos = WhiteboardUITools.getTouchPos(e);
        this.draw(touchPos[0], touchPos[1], 0);

        if (!e) {
            e = event;
        }
        e.preventDefault();

        this.addPositionToBatch(touchPos[0] + "," + touchPos[1]);
    }

    addPositionToBatch(data) {
        this.dataBatch += data + ";";
    }

    reset() {
        WhiteboardUITools.resizeCanvas(this.canvas);
        WhiteboardUITools.clearCanvas(this.canvas, this.ctx);
    }

    onNetworkData(senderAddress, data) {
        this.lastDataReceived = SpixiTools.getTimestamp();
        if (data == "ping") {
            return;
        }

        if (data == "reset") {
            this.reset();
            return;
        }

        var segments = data.split(";");
        for (var i in segments) {
            var coords = segments[i].split(",");
            this.draw(coords[0], coords[1], 1);
        }
    }

    draw(x, y, user) {
        let r = 0;
        let g = 0;
        let b = 0;

        switch (user) {
            case 0:
                r = 255;
                break;
            case 1:
                b = 255;
                break;
            case 2:
                g = 255;
                break;
        }

        WhiteboardUITools.drawDot(this.ctx, x, y, 1, r, g, b);
    }
}

var spixiWhiteboard = new SpixiWhiteboard();

SpixiAppSdk.onInit = function (sessionId, userAddress, ...remoteAddresses) {
    spixiWhiteboard.init("whiteboardCanvas");
};

SpixiAppSdk.onNetworkData = function (senderAddress, data) {
    spixiWhiteboard.onNetworkData(senderAddress, data);
};

// Start the app on load
window.onload = SpixiAppSdk.fireOnLoad;
