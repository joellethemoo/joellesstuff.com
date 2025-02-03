const audioPlayback = document.getElementById('audioPlayback');
const progressBar = document.getElementById('progressBar');
const debugOutput = document.getElementById('debugOutput');

let mediaRecorder;
let audioChunks = [];
let recordingInterval;
let progressInterval;

function showDebug(message) {
    debugOutput.textContent = message;
}

function setMediaDevice() {
    showDebug('Setting media device');
    // Ensure audio playback on the media device
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const mediaDevices = devices.filter(device => device.kind === 'audiooutput');
        if (mediaDevices.length > 0) {
            const targetDevice =  mediaDevices[0];
            const deviceId = targetDevice.deviceId;
            audioPlayback.setSinkId(deviceId)
                .then(() => {
                    console.log('Audio playback set to media device');
                    showDebug('Audio device set to ' + targetDevice.label);
                })
                .catch((error) => {
                    console.error('Error setting audio playback device:', error);
                    showDebug('Failed to set audio device to ' + targetDevice.label);
                });
        }
    })
    .catch((error) => {
        console.error('Error enumerating devices:', error);
        showDebug('Error enumerating devices');
    });
}

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        setMediaDevice();
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayback.src = audioUrl;
        audioPlayback.play();
        audioChunks = [];
        progressBar.style.width = '0%';
    };

    recordingInterval = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            mediaRecorder.start();
            updateProgressBar();
        }
    }, 10000);

    mediaRecorder.start();
    updateProgressBar();
}

function updateProgressBar() {
    let width = 0;
    progressInterval = setInterval(() => {
        if (width >= 100) {
            clearInterval(progressInterval);
        } else {
            width += 1;
            progressBar.style.width = width + '%';
        }
    }, 100);
}

window.addEventListener('load', startRecording);
