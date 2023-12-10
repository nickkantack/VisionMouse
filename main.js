
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

// Create DOM elements
const player = document.createElement("video");
player.autoplay = true;
const debug = document.createElement("div");
document.body.appendChild(debug);
document.body.appendChild(player);

const mouse = document.createElement("div");
mouse.style = `position: absolute; left: 0; top: 0; width: 10px; height: 10px; z-index: 100; background: #000;`;
document.body.appendChild(mouse);

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
        
        // Move the mouse to the correct location
        if (hands && hands.length > 0) {
            const thumbTipKeypoint = [...hands[0].keypoints].filter(x => x.name === "thumb_tip")[0];
            const cursorLeftPixels = thumbTipKeypoint.x / player.getBoundingClientRect().width * screen.width;
            const cursorTopPixels = thumbTipKeypoint.y / player.getBoundingClientRect().height * screen.height;
            mouse.style.transform = `translate(${screen.width - cursorLeftPixels}px, ${cursorTopPixels}px)`;
        }

        // Use document.elementFromPoint(x, y).click(); to click things

        requestAnimationFrame(callback);
    };
    setTimeout(() => {
        requestAnimationFrame(callback);
    }, 2000);
});