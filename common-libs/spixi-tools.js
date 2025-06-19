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

function executeUiCommand(cmd) {
    SpixiTools.executeUiCommand.apply(null, arguments);
};

var SpixiTools = {
    version: 0.1,
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
            .replace(/&#92;/g, "\\")
            .replace(/&#39;/g, "'")
            .replace(/&#34;/g, "\"");
    },
    escapeParameter: function (str) {
        return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    getTimestamp: function() {
        return Math.round(+new Date() / 1000);
    }
}
