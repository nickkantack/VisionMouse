
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
mouse.style = `position: absolute; left: 0; top: 0; width: 10px; height: 10px; z-index: 100; background: #000; pointer-events: none;`;
document.body.appendChild(mouse);

let isMouseDownStabilized = false;
let isMouseDown = false;
let lastMouseDownStabilizedChangeTime = 0;
let stabilizeTimeout;
const SEPARATION_THRESHOLD = 500;
const DEBOUNCE_TIME = 50;

// Attach the video stream to the video element and autoplay.
let awaitingPreviousHandEstimation = false;
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    player.srcObject = stream;
    const callback = async () => {
        if (awaitingPreviousHandEstimation) return;
        awaitingPreviousHandEstimation = true;
        const hands = await detector.estimateHands(player);
        awaitingPreviousHandEstimation = false;
        
        // Move the mouse to the correct location
        if (hands && hands.length > 0) {
            const thumbTipKeypoint = [...hands[0].keypoints].filter(x => x.name === "thumb_tip")[0];
            const cursorLeftPixels = thumbTipKeypoint.x / player.getBoundingClientRect().width * screen.width;
            const cursorTopPixels = thumbTipKeypoint.y / player.getBoundingClientRect().height * screen.height;
            mouse.style.transform = `translate(${screen.width - cursorLeftPixels}px, ${cursorTopPixels}px)`;

            // Detect if there is a click
            const indexFingerTipKeypoint = [...hands[0].keypoints].filter(x => x.name === "index_finger_tip")[0];
            const separation = Math.pow(indexFingerTipKeypoint.x - thumbTipKeypoint.x, 2) + 
                Math.pow(indexFingerTipKeypoint.y - thumbTipKeypoint.y, 2);
                
            const isSeparationBelowThreshold = separation < SEPARATION_THRESHOLD;
            if (isSeparationBelowThreshold !== isMouseDown) {
                clearTimeout(stabilizeTimeout);
                isMouseDown = isSeparationBelowThreshold;
                if (isMouseDown !== isMouseDownStabilized) {
                    stabilizeTimeout = setTimeout(() => {
                        isMouseDownStabilized = isMouseDown;
                        // Dispatch click
                        if (isMouseDownStabilized) {
                            console.log("click");
                            document.elementFromPoint(screen.width - cursorLeftPixels, cursorTopPixels).click();
                        }
                    }, DEBOUNCE_TIME);
                }
            }
        }

        requestAnimationFrame(callback);
    };
    setTimeout(() => {
        requestAnimationFrame(callback);
    }, 2000);
});