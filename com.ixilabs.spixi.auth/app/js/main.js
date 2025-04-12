function init() {

    setInterval(androidFix, 100);
    var el = document.getElementById("reader");
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