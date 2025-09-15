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

function init() {

    setInterval(androidFix, 100);
    var afix = document.getElementById("afix").innerHTML;

    // Fix for camera view freeze on some Android devices
    function androidFix() {
        document.getElementById("afix").innerHTML = afix;
    }

    const html5QrCode = new Html5Qrcode(
        "reader", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        SpixiAppSdk.spixiAction(decodedText);
    };
    const config = {
        fps: 15,
        qrbox: 250,
        showTorchButtonIfSupported: true,
        focusMode: "continuous",
        showZoomSliderIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);

    setTimeout(function () {
        html5QrCode.applyVideoConstraints({
            focusMode: "continuous",
            advanced: [{ zoom: 2.0 }],
        });
    }, 1000);

    // Notify C# that the app has loaded
    SpixiAppSdk.fireOnLoad();
}

document.getElementById('authBtn').addEventListener('click', function () {
    const textarea = document.getElementById('serviceAction');
    const value = textarea.value.trim();
    const errorMsg = document.getElementById('errorMessage');

    if (!value) {
        textarea.classList.add('invalid');
        errorMsg.style.display = 'block';
    } else {
        textarea.classList.remove('invalid');
        errorMsg.style.display = 'none';
        SpixiAppSdk.spixiAction(value);
    }
});