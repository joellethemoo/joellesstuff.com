const audioPlayback = document.getElementById('audioPlayback');
const progressBar = document.getElementById('progressBar');

let mediaRecorder;
let audioChunks = [];
let recordingInterval;
let progressInterval;

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
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
