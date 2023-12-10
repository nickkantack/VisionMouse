
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';

const model = handPoseDetection.SupportedModels.MediaPipeHands;
const detectorConfig = {
    runtime: 'mediapipe', // or 'tfjs',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'full'
}
const detector = await handPoseDetection.createDetector(model, detectorConfig);

const player = document.createElement("video");
player.autoplay = true;
const debug = document.createElement("div");
document.body.appendChild(debug);
document.body.appendChild(player);

// Attach the video stream to the video element and autoplay.
let awaitingPreviousHandEstimation = false;
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    player.srcObject = stream;
    const callback = async () => {
        if (awaitingPreviousHandEstimation) return;
        awaitingPreviousHandEstimation = true;
        const hands = await detector.estimateHands(player);
        awaitingPreviousHandEstimation = false;
        debug.innerHTML = hands && hands.length > 0 ? hands[0].score : 0;
        requestAnimationFrame(callback);
    };
    setTimeout(() => {
        requestAnimationFrame(callback);
    }, 2000);
});