const audioPlayback = document.getElementById('audioPlayback');
const progressBar = document.getElementById('progressBar');
const debugOutput = document.getElementById('debugOutput');
const startButton = document.getElementById('startButton');

let mediaStream;
let mediaRecorder;
let audioChunks = [];
let recordingInterval;
let progressInterval;
let isPaused = false;
let isRecording = false;
let isDataAvailable = false;
let loopTimer = 0;

let audioObjectLog = [];

function showDebug(message) {
    debugOutput.textContent = message;
}

async function startMediaStream() {
    isDataAvailable = false;

    if (mediaRecorder != null) {
        mediaRecorder.ondataavailable = (event) => {};
        mediaRecorder.stop();
        mediaRecorder = null;
    }
    if (mediaStream != null) {
        stopMediaStream();
        mediaStream = null;
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(mediaStream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
        console.log("pushing audio: ", audioChunks);
        isDataAvailable = true;
    };

    mediaRecorder.onstart = (event) => {
        console.log("media recorder onstart");
    };

    mediaRecorder.onstop = (event) => {
        console.log("media recorder onstop");
    };

    mediaRecorder.onerror = (event) => {
        console.log("media recorder error: ", event.error);
    }

    console.log("starting media recorder");
    mediaRecorder.start();
    isRecording = true;
    //updateProgressBar();
}

async function startRecording() {
    startButton.style.display = 'none';

    const loopFrequency = 100;
    const timerLength = 10000;
    recordingInterval = setInterval(() => {
        loopTimer = loopTimer + loopFrequency;
        if (isRecording) {
            let progressPerecent = Math.ceil(Math.min(100, loopTimer / timerLength * 100));
            progressBar.style.width = progressPerecent + '%';
        }
        if (loopTimer > timerLength) {
            if (!isRecording) {
                console.log("starting recording interval");
                startMediaStream().then(() => {
                    console.log("startMediaStream.then");
                    loopTimer = 0;
                }).catch((error) => console.log("Error startMediaStream: ", error));
            } else {
                if (!isDataAvailable && mediaRecorder.state == 'recording') {
                    mediaRecorder.stop();
                } else if (isDataAvailable) {
                    isRecording = false;
                    stopMediaStream();

                    console.log("playing back audio interval");
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    audioObjectLog.push(audioUrl);
                    audioPlayback.src = audioUrl;
                    console.log("Loaded audio url: ", audioUrl);
                    audioPlayback.play();
                    audioChunks = [];

                    isDataAvailable = false;
                    loopTimer = 0;
                }
            }
        }
    }, loopFrequency);

    startMediaStream();
}

function stopMediaStream() {
    mediaStream.getTracks().forEach(track => track.stop());
    console.log("stopped media stream");
}

startButton.addEventListener('click', startRecording);
