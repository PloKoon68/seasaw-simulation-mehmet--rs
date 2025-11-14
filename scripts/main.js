export let balls = []

import { draw } from './drawing.js';
import { updateDroppedBallPositionY, updateNetTorque, calculateBalltargetY, horizontalDistanceToPivot, updateFallingBallTarget } from './physics.js';
import { htmlUpdateLeftWeight, htmlUpdateRightWeight, htmlUpdateLeftRawTorque, htmlUpdateRightRawTorque, htmlUpdateRotationParameters, htmlUpdateNextWeight, htmlUpdateRotationIndicator  } from './ui_updates.js';
import { saveStateToLocalStorage, loadStateFromLocalStorage, resetSeesaw, randomDarkColor } from './state.js';
import { startFalling } from './threads/threadOperations.js';
import { continueSimulation, pauseSimulation  } from './actions.js';

 
//set functions so other files functions can mutate them
export function setMeasures(newMeasures) {
    console.log("sıfırlıtyo: ", newMeasures.angle, measures.angle)
    measures = newMeasures;
    console.log("sıfırladık: ", measures.angle)
}

export function setIsPaused(value) {
    isPaused = value;
}

export function setBalls(newBalls) {
    balls = newBalls;
}

export function setRotationThread(newThread) {
    rotationThread = newThread;
}

export function setBallCount(newBallCount) {
    ballCount = newBallCount;
}


export const canvas = document.getElementById('seasawCnvs');  //main canvas element

export const ctx = canvas.getContext('2d');   //for drawing objects in canvas

//note: this system is assumed to have a square shape canvas (width=height)
//also, fror ease of use, percentage of width-height is used for location unit 
//instead of raw pixel

export const rect = canvas.getBoundingClientRect();   //for boundary px

export const LENGTH = canvas.width
export const HEIGHT = canvas.height

export const PLANK_LENGTH = 80;  //!!! CANVAS LENGTH IS 500px. 80% is 400px for seasaw plank, as expected in requirements.
export const PLANK_WIDTH = 5;

export let ballCount = 0;
export let isPaused;

export let measures = {
    left_side: {weight: 0, rawTorque: 0, netTorque: 0},
    right_side: {weight: 0, rawTorque: 0, netTorque: 0},
    angle: 0,
    angularAcceleration: 0,
    angularVelocity: 0
}


export const pauseButton = document.getElementById("pause-button");


pauseButton.addEventListener("click", () => {
    if (!isPaused) {
        pauseSimulation();
    } else {
        continueSimulation();
    }
    isPaused = !isPaused;
});






function createNewBall(event) {
    const weight = Math.floor(Math.random() * 10) + 1;
    const r = 4 + weight/3;

    const radian = measures.angle * Math.PI / 180
    const maxMovablePoint = Math.abs(Math.cos(radian) * (PLANK_LENGTH/2))   //dynamic based on angle of plank

    balls.push({ 
        x: Math.min(50+maxMovablePoint, Math.max(50-maxMovablePoint, ((event.clientX - rect.left) / rect.width) * 100)),
        y: 10,
        r: r,
        color:  randomDarkColor(),
        visible: true,
        falling: false,
        savedFallSpeed: 0,
        targetX: null,  
        targetY: null,
        weight: weight,
        d: null,
        onRightSide: null,
        id: ballCount++
    }); 

    htmlUpdateNextWeight();
}






//generate seperate thread for each falling ball
export let fallThreads = new Map();  //store currently working threads in a set

export let rotationThread;

// ball on mouse cursor
canvas.addEventListener('mousemove', (event) => {
    let lastBallIndex = balls.length-1
    const radian = measures.angle * Math.PI / 180
    const maxMovablePoint = Math.abs(Math.cos(radian) * (PLANK_LENGTH/2))   //dynamic based on angle of plank

    balls[lastBallIndex].x = Math.min(50+maxMovablePoint, Math.max(50-maxMovablePoint, ((event.clientX - rect.left) / rect.width) * 100));
    balls[lastBallIndex].y = 10;
    balls[lastBallIndex].visible = true;

    draw();
});

// remove ball when leaves canvas
canvas.addEventListener('mouseleave', () => {
    balls[balls.length-1].visible = false;
    draw();
});


// drop the ball on click
canvas.addEventListener('click', (event) => {
    if(!isPaused) {
        let lastBallIndex = balls.length-1
        balls[lastBallIndex].falling = true;
        calculateBalltargetY(balls[lastBallIndex], measures.angle)
        startFalling(balls[lastBallIndex])
        createNewBall(event)
        draw();
    } else {
        alert('First press continue please!')
    }
});

window.addEventListener("beforeunload", saveStateToLocalStorage);
window.addEventListener("load", loadStateFromLocalStorage);
document.getElementById("reset-button").addEventListener("click", resetSeesaw);
 