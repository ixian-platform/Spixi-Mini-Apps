function sendVideoData(e) {
    location.href = "ixian:data" + mouseX + ";" + mouseY;
}

function init() {
    try
    {
        var video = document.getElementById("videoElement");

        if (navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
              video.srcObject = stream;
            })
            .catch(function (e) {
              alert("Something went wrong: " + e);
            });
        }
    }catch(e)
    {
        alert(e);
    }

    location.href = "ixian:onload";
}

function networkData(data) {
}