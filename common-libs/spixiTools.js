function executeUiCommand(cmd) {
    SpixiTools.executeUiCommand.apply(null, arguments);
};

var SpixiTools = {
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
