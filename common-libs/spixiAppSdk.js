// Spixi Mini Custom App SDK


var SpixiAppSdk = {
    version: 0.1,
    date: "2024-09-20",
    fireOnLoad: function () { location.href = "ixian:onload"; },
    back: function () { location.href = "ixian:back"; },
    sendNetworkData: function (data) { location.href = "ixian:data" + encodeURIComponent(data); },
    getStorageData: function (key) { location.href = "ixian:getStorageData" + encodeURIComponent(key); },
    setStorageData: function (key, value) { location.href = "ixian:setStorageData" + encodeURIComponent(key) + "=" + encodeURIComponent(value); },
    spixiAction: function (actionData) { location.href = "ixian:action" + encodeURIComponent(actionData); },

    // on* handlers should be overriden by the app
    onStorageData: function (key, value) { /*alert("Received storage data: " + key + "=" + value);*/ },
    onNetworkData: function (senderAddress, data) { /*alert("Received network data from " + senderAddress + ": " + data);*/ },
    onRequestAccept: function (data) { /*alert("Received request accept: " + data);*/ },
    onRequestReject: function (data) { /*alert("Received request reject: " + data);*/ },
    onAppEndSession: function (data) { /*alert("Received app end session: " + data);*/ },
};
