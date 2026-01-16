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

function executeUiCommand(cmd) {
    SpixiTools.executeUiCommand.apply(null, arguments);
};

var SpixiTools = {
    version: 0.2,
    base64ToBytes: function (base64) {
        const binString = atob(base64);
        return new TextDecoder().decode(Uint8Array.from(binString, (m) => m.codePointAt(0)));
    },
    executeUiCommand: function (cmd) {
        try {
            var decodedArgs = new Array();
            for (var i = 1; i < arguments.length; i++) {
                decodedArgs.push(SpixiTools.base64ToBytes(arguments[i]));
            }
            cmd.apply(null, decodedArgs);
        } catch (e) {
            var alertMessage = "Cmd: " + cmd + "\nArguments: " + decodedArgs.join(", ") + "\nError: " + e + "\nStack: " + e.stack;
            alert(alertMessage);
        }
    },
    unescapeParameter: function (str) {
        return str.replace(/&gt;/g, ">")
            .replace(/&lt;/g, "<")
            .replace(/&bsol;/g, "\\")
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, "\"")
            .replace(/&amp;/g, "&");
    },
    escapeParameter: function (str) {
        return str
            .replace(/&(?!#\d+;|#x[\da-fA-F]+;)/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")
            .replace(/\\/g, "&bsol;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },
    getTimestamp: function() {
        return Math.round(+new Date() / 1000);
    }
}
