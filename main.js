
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
player.style = `position: fixed; left: 0; top: 0; width: 20%;`;
const debug = document.createElement("div");
document.body.appendChild(debug);
document.body.appendChild(player);

const mouse = document.createElement("div");
mouse.id = "vision-mouse";
mouse.style = `position: absolute; left: 0; top: 0; width: 10px; height: 10px; z-index: ${Math.pow(10, 10)}; background: #000; pointer-events: none;`;
document.body.appendChild(mouse);

let isMouseDownStabilized = false;
let isMouseDown = false;
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
            if (hands.length === 1) {
                console.log(thumbTipKeypoint.x);
                const cursorLeftPixels = thumbTipKeypoint.x / 630 * screen.width;
                const cursorTopPixels = thumbTipKeypoint.y / 630 * screen.height;
                mouse.style.transform = `translate(${screen.width - cursorLeftPixels}px, ${document.documentElement.scrollTop + cursorTopPixels}px)`;

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

            // Detect if we are scrolling
            if (hands.length === 2) {
                const thumbIpKeypoint = [...hands[0].keypoints].filter(x => x.name === "thumb_ip")[0];
                const isScrolling = Math.abs(thumbIpKeypoint.y - thumbTipKeypoint.y) > 20;
                const isDirectionUp = thumbIpKeypoint.y > thumbTipKeypoint.y;
                if (isScrolling) {
                    const currentTop = document.documentElement.scrollTop || document.body.scrollTop;
                    document.documentElement.scrollTop = document.body.scrollTop = currentTop + (isDirectionUp ? -10 : 10);
                }
            }
            
            
            // Ensure that the cursor has the highest z index
            const allElements = [...document.querySelectorAll("*")].filter(x => x.id !== "vision-mouse");
            let highestZIndex = parseInt(mouse.style.zIndex) - 1;
            for (let element of allElements) {
                const rivalIndex = parseInt(element.style.zIndex) || 1;
                if (rivalIndex > highestZIndex) highestZIndex = rivalIndex;
            }
            mouse.style.zIndex = highestZIndex + 1;
        }

        requestAnimationFrame(callback);
    };
    setTimeout(() => {
        requestAnimationFrame(callback);
    }, 2000);
});