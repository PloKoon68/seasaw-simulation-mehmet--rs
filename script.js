const canvas = document.getElementById('seasawCnvs');  //main canvas element

//note: this system is assumed to have a square shape canvas (width=height)
//also, fror ease of use, percentage of width-height is used for location unit 
//instead of raw pixel

const ctx = canvas.getContext('2d');   //for drawing objects in canvas
const rect = canvas.getBoundingClientRect();   //for boundary px

const LENGTH = canvas.width

const PLANK_LENGTH = 80;  //!!! CANVAS LENGTH IS 500px. 80% is 400px for seasaw plank, as expected in requirements.
const PLANK_WIDTH = 5;

const DROP_BALL_HORIZONTAL_LIMIT = 10  // if mouse is outside 10 percent to the side of canvas horizontal line, it is not droppable




let balls = []
let ballCount = 0;

let measures = {
    left_side: {weight: 0, rawTorque: 0, netTorque: 0},
    right_side: {weight: 0, rawTorque: 0, netTorque: 0},
    angle: 0,
    angularAcceleration: 0,
    angularVelocity: 0
}

let isPaused;


function resetSeesaw() {
    isPaused = false;
    continueSimulation()

    // Reset balls and measuers
    balls = [];
    measures = {
        left_side: {weight: 0, rawTorque: 0, netTorque: 0},
        right_side: {weight: 0, rawTorque: 0, netTorque: 0},
        angle: 0,
        angularAcceleration: 0,
        angularVelocity: 0
    };

    // Stop all threads
    terminateFallingThreads()
    terminateRotationThread()
    // clean Localstorage

    // New initial ball
    const initialWeight = Math.floor(Math.random() * 10) + 1;
    const initialRadius = 4 + initialWeight / 3;
    ballCount = 0;
    balls.push({
        x: 0,
        y: 0,
        r: initialRadius,
        color: randomDarkColor(),
        visible: false,
        falling: false,
        savedFallSpeed: 0,
        targetX: null,
        targetY: null,
        weight: initialWeight,
        d: null,
        onRightSide: null,
        id: ballCount++
    });

    htmlUpdateNextWeight();
    htmlUpdateLeftWeight();
    htmlUpdateRightWeight();
    htmlUpdateLeftRawTorque();
    htmlUpdateRightRawTorque();
    htmlUpdateRotationParameters();

    document.querySelector('.logs-panel').innerHTML = '';


    draw();
}




const pauseButton = document.getElementById("pause-button");


pauseButton.addEventListener("click", () => {
    if (!isPaused) {
        pauseSimulation();
    } else {
        continueSimulation();
    }
    isPaused = !isPaused;
});


function pauseSimulation() {

    // Delete all active threasd
    if (rotationThread)
        terminateRotationThread();

    terminateFallingThreads();

    //update in html
    pauseButton.textContent = "Continue";
    pauseButton.classList.add("continue-button");
    pauseButton.classList.remove("pause-button");
    pauseButton.style.backgroundColor = "#27ae60";
}

function continueSimulation() {

    //continue the therads from where they were left
    let lastAngularVelocity = measures.angularVelocity
    startRotation(lastAngularVelocity)
    
    for(let i = 0; i < balls.length; i++)
        if(balls[i].falling) 
            startFalling(balls[i], balls[i].loadedFallSpeed)

    //update in html
    pauseButton.textContent = "Pause";
    pauseButton.classList.add("pause-button");
    pauseButton.classList.remove("continue-button");
    pauseButton.style.backgroundColor = "rgb(229, 222, 14)";

}
document.getElementById("reset-button").addEventListener("click", resetSeesaw);


//////////////////////////////////////////////

function htmlUpdateRightWeight() {document.getElementById("right-weight").textContent = measures.right_side.weight;}
function htmlUpdateLeftWeight() {document.getElementById("left-weight").textContent = measures.left_side.weight;}

function htmlUpdateRightRawTorque() {document.getElementById("right-raw-torque").textContent = measures.right_side.rawTorque.toFixed(0)}
function htmlUpdateLeftRawTorque() {document.getElementById("left-raw-torque").textContent = measures.left_side.rawTorque.toFixed(0)}

function htmlUpdateRotationParameters() {
    document.getElementById("right-net-torque").textContent = measures.right_side.netTorque.toFixed(0);
    document.getElementById("left-net-torque").textContent = measures.left_side.netTorque.toFixed(0);


    document.getElementById("angle").textContent = measures.angle.toFixed(2);
    document.getElementById("angular-velocity").textContent = measures.angularVelocity.toFixed(4);
    document.getElementById("angular-acceleration").textContent = measures.angularAcceleration.toFixed(4);
}

function htmlUpdateNextWeight(){document.getElementById("next-weight").textContent = balls[balls.length-1].weight;}


// update the arrow sign in html
function htmlUpdateRotationIndicator() {
    const indicator = document.getElementById('rotation-indicator');
    
    if(measures.angularAcceleration > 0 || measures.angularAcceleration < 0) {
        // show the motion
        indicator.classList.add('visible');
        
        if (measures.angularAcceleration > 0) {
            // turn right
            indicator.classList.remove('rotating-left');
            indicator.classList.add('rotating-right');
        } else {
            // turn left
            indicator.classList.remove('rotating-right');
            indicator.classList.add('rotating-left');
        }
    } else {
        // motionless (hide)
        indicator.classList.remove('visible', 'rotating-left', 'rotating-right');
    }
}



function addLog(weight, side, distance) {
    const logsPanel = document.querySelector('.logs-panel');
    
    const log = document.createElement('div');
    log.className = 'log-item';
    distance = percentage_to_px(distance.toFixed(2))
    log.textContent = `${weight}kg laned on ${side} side at ${distance}px from pivot center`;
    
    logsPanel.appendChild(log);
    logsPanel.scrollTop = logsPanel.scrollHeight;
}

function logsList() {
    const logsPanel = document.querySelector('.logs-panel');
    const logs = [];
    
    logsPanel.querySelectorAll('.log-item').forEach(log => {
        logs.push(log.textContent);
    });
    
    return logs;
}

function loadLogs(logsList) {
    const logsPanel = document.querySelector('.logs-panel');
    
    logsList.forEach(logText => {
        const log = document.createElement('div');
        log.className = 'log-item';
        log.textContent = logText;
        logsPanel.appendChild(log);
    });
    logsPanel.scrollTop = logsPanel.scrollHeight;

}



///////////////////////////////////
// bonus effects 


let audioContext = null;
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

//generate sound with intensity proportionate to the weight
function playImpactSound(weight) {
    try {
        const ctx = getAudioContext();
        
        
        const intensity = (weight**3) / 10; // between 0 and 1
        
        // Oscillator (tone generator)
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Creaet connection
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // frequence: heavy = low frequence, light objects = high frequence
        const baseFrequency = 150 - (weight * 10); // 50-140 Hz
        oscillator.frequency.setValueAtTime(baseFrequency, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            baseFrequency * 0.5, 
            ctx.currentTime + 0.1
        );
        
        oscillator.type = 'triangle';
        
        const volume = 0.2 + (intensity * 0.3); // 0.2 - 0.5 arası
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}



//distance from center indicator

function drawDistanceGrid(centerX, centerY) {
    centerX = percentage_to_px(centerX)
    centerY = percentage_to_px(centerY)

    ctx.save();
    
    const gridSpacing = PLANK_LENGTH/2; // 40px space between numbers
    const gridCount = 5;    // 5 main lines
    const rulerY = centerY + 45; // ruler position
    
    // background
    ctx.fillStyle = 'rgba(238, 243, 233, 0.8)';
    ctx.fillRect(
        centerX - (gridCount * gridSpacing) - 10, 
        rulerY - 15, 
        (gridCount * 2 * gridSpacing) + 20, 
        25
    );


    // ruker lines
    for (let i = -gridCount; i <= gridCount; i++) {
        const x = centerX + (i * gridSpacing);
        const distance = Math.abs(i * gridSpacing);
        
        // line height
        const isCenter = i === 0;
        const isMajor = Math.abs(i % 2) === 1; // Every 2 lines are longer
        const lineHeight = isCenter ? 20 : (isMajor ? 12 : 6);
        
        // line clor
        if (isCenter) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
        } else if (i < 0) {
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.4)'; // Left side color
            ctx.lineWidth = 1;
        } else {
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)'; // Right side color
            ctx.lineWidth = 1;
        }
        
        // draw line
        ctx.beginPath();
        ctx.moveTo(x, rulerY - lineHeight/2);
        ctx.lineTo(x, rulerY + lineHeight/2);
        ctx.stroke();
        
        // labels (only for major ones)
        if (isMajor && !isCenter) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${distance}`, x, rulerY + 20);
        }
    }
    
    // center label
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PIVOT', centerX, rulerY - 20);

    const ballToDrop = balls[balls.length-1]
    if(ballToDrop.visible) {

        let ballX = ballToDrop.x
        let ballXPx = percentage_to_px(ballX)
        let lineHeight = 10
    
        ctx.strokeStyle = '#161414ff';
        ctx.beginPath();
        ctx.moveTo(ballXPx, rulerY - lineHeight/2);
        ctx.lineTo(ballXPx, rulerY + lineHeight/2);
        ctx.stroke();


        ctx.fillStyle = '#161414ff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        
        ctx.fillText('' + (ballXPx-250).toFixed(1), ballXPx, rulerY-10);
    }
    
    ctx.restore();
}

///////////////////////////////////////////////////////////////////////////////


//p prefix means percentage, instead of raw pixels
const percentage_to_px = (percentage) => {
    return percentage * LENGTH / 100;
}

const pfillRectWith = (x, w, y, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(percentage_to_px(x), percentage_to_px(y), percentage_to_px(w), percentage_to_px(h));
}


const pdrawShape = (coordinates, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(percentage_to_px(coordinates[0][0]), percentage_to_px(coordinates[0][1])); 
    for(let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(percentage_to_px(coordinates[i][0]), percentage_to_px(coordinates[i][1]));
    }
    ctx.closePath();
    ctx.fill();  
}

function pdrawBall(ball) {
    ctx.beginPath();           

    ctx.arc(percentage_to_px(ball.x), percentage_to_px(ball.y), percentage_to_px(ball.r), 0, Math.PI * 2); // 2pi for full circle
    ctx.fillStyle = ball.color;
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';     
    ctx.textBaseline = 'middle';  
    ctx.fillText( ball.weight+'kg', percentage_to_px(ball.x), percentage_to_px(ball.y));

    ctx.closePath();
}

function pDrawSeesaw(angleDegrees) {
    const pivotX = percentage_to_px(50);
    const pivotY = percentage_to_px(50);
    const angleRadians = angleDegrees * Math.PI / 180;

    ctx.save(); // save current canvas state

    // Move origin to pivot point (center of canvas)
    ctx.translate(pivotX, pivotY);

    // Rotate around pivot
    ctx.rotate(angleRadians); // positive meaning right side heavier


    pdrawShape([
        [-PLANK_LENGTH/2, PLANK_WIDTH/2], [PLANK_LENGTH/2, PLANK_WIDTH/2],
        [PLANK_LENGTH/2, -PLANK_WIDTH/2], [-PLANK_LENGTH/2, -PLANK_WIDTH/2]
    ], '#8f5509ff');

    ctx.restore(); // restore to unrotated state
}



///////////////////////

function calculateBalltargetY(ball, angle) {    // called for each ball when the rotation thread updates the angle
    const radian = angle * Math.PI / 180;
    const newTargetY = (Math.tan(radian) * (ball.x - 50)) + (-(PLANK_WIDTH/2)/Math.cos(radian) - ball.r) + 50
    ball.targetY = newTargetY
}
function updateFallingBallTarget(ball) {
    const thread = fallThreads.get(ball.id);
    if (thread) {
        thread.postMessage({
            type: 'update',
            targetY: ball.targetY
        });
    }
}

function updateDroppedBallPositionY(ball, angle) {    // called for each ball when the rotation thread updates the angle
    const radian = angle * Math.PI / 180;

    const newY = ball.d * Math.sin(radian) - (ball.r + PLANK_WIDTH/2) * Math.cos(radian) + 50;
    const newX = ball.d * Math.cos(radian) + (ball.r + PLANK_WIDTH/2) * Math.sin(radian) + 50;

    ball.y = newY
    ball.x = newX
}

function horizontalDistanceToPivot(ball) {
    const radian = measures.angle * Math.PI / 180;

    const dInPixel = percentage_to_px(ball.d)  //convert to pixel

    return dInPixel * Math.cos(radian) + Math.sin(radian) * (PLANK_WIDTH/2 + ball.r)
}

function updateNetTorque() {
    const radian = measures.angle * Math.PI / 180;
    
    measures.right_side.netTorque = measures.right_side.rawTorque * Math.cos(radian)
    measures.left_side.netTorque = measures.left_side.rawTorque * Math.cos(radian)
}


///////////////////////




function distanceToCenterFromBallTouchPoint(bx, by, r) {
    const radian = measures.angle * Math.PI / 180   // get the current angle

    const dPerpendicularToPlankFromCenter = r + PLANK_WIDTH/2
    const dx = bx - dPerpendicularToPlankFromCenter * Math.sin(radian);
    const dy = by + dPerpendicularToPlankFromCenter * Math.cos(radian);   
    const d = Math.sqrt((dx - 50)**2 + (dy - 50)**2);  //returns positive anyway
    return dx < 50? -d: d;   //if on the left side of the plank, return negative d
}


function randomDarkColor() {
    let r, g, b;
    do {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
    } while ((r + g + b) / 3 > 180); // keep looping if it's too bright

    return `rgb(${r}, ${g}, ${b})`;
}

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



// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw ground
    pfillRectWith(0, 100, 60, 40, '#0d8a41ff');

    // draw ruler grid to show distance from
    drawDistanceGrid(50, 66.3);

    // draw pivot triangle at the center (50% width, 50% height)
    pdrawShape([[50, 50], [45, 60], [55, 60]], '#5d6767ff');

    // draw seesaw plank
    pDrawSeesaw(measures.angle);

    // draw balls
    let lastBallIndex = balls.length-1
    for(let i = 0; i < lastBallIndex; i++) {
        pdrawBall(balls[i]);
    }
    if(balls[lastBallIndex].visible) pdrawBall(balls[lastBallIndex]);
}


//generate seperate thread for each falling ball
const fallThreads = new Map();  //store currently working threads in a set
function startFalling(ball, loadedFallSpeed) {
    const fallThread = new Worker('fallThread.js');

    // Add threadto map, bonding it with relevant ball (with ball id)
    fallThreads.set(ball.id, fallThread);


    fallThread.postMessage({
        type: 'initial',
        targetY: ball.targetY,
        y: ball.y,
        loadedFallSpeed: loadedFallSpeed
    });

    fallThread.onmessage = function (e) {
        ball.y = e.data.y;   // update balls current position
        ball.savedFallSpeed = e.data.fallSpeed; //saving for load state
        draw();

        if (e.data.done) {   // the moment ball has fallen and touches the plank
            playImpactSound(ball.weight);


            ball.d = distanceToCenterFromBallTouchPoint(ball.x, ball.y, ball.r);  //d is negative if ball is on the left arm of plank
            addLog(ball.weight, ball.x > 50? "right": "left", ball.d) //update in html

            ball.falling = false;   //ball falled
           
            fallThread.terminate(); // close the thread
            fallThreads.delete(ball.id); // delte it from the set

            updateTorque(ball);
        }
    };
}


function updateTorque(ball) {
    //torque calculation: d * w    
    const torque = horizontalDistanceToPivot(ball) * ball.weight;

    //update measures object and html indicators
    if(ball.x >= 50) {
        measures.right_side.weight += ball.weight;
        measures.right_side.rawTorque += torque;

        htmlUpdateRightWeight();
        htmlUpdateRightRawTorque();   
    }
    else {
        measures.left_side.weight += ball.weight;
        measures.left_side.rawTorque += Math.abs(torque);

        htmlUpdateLeftWeight();
        htmlUpdateLeftRawTorque();
    }

    draw()

    if(rotationThread) {  //if the plank was on rotation during the ball touced the plank, update rotation parameters
        rotationThread.postMessage({
            type: 'update',
            measures: measures,
            balls: balls.slice(0, -1)
        })
    } else {
        startRotation()
    }
    //start rotating
}

let rotationThread;
function startRotation(loadedAngularVelocity) {

    rotationThread = new Worker('rotationThread.js');
    rotationThread.postMessage({
        measures: measures,
        balls: balls.slice(0, -1),
        type: 'initial',
        loadedAngularVelocity: loadedAngularVelocity
    });


    rotationThread.onmessage = function(e) {  //angle updated
        measures.angle = e.data.angle; // update ball position
        measures.angularAcceleration = e.data.angularAcceleration
        measures.angularVelocity = e.data.angularVelocity
        
        //update already dropped balls positions
        for(let i = 0; i < balls.length-1; i++) {   
            if(!balls[i].falling) 
                updateDroppedBallPositionY(balls[i], measures.angle)
        }

        if(measures.angle !== 30 && measures.angle !== -30) {

            for(let i = balls.length-1; i >= 0; i--) {
                if(balls[i].falling) { //last n balls are falling, update their targetY
                    calculateBalltargetY(balls[i], measures.angle);  //last balls targetY change
                    updateFallingBallTarget(balls[i])                //send new targetY value to fallingThread of that ball
                }
            }
        }
        if(e.data.finished) {
            terminateRotationThread();
  
            htmlUpdateRotationIndicator()
            //angular velocity and acceleration becomes 0
            measures.angularVelocity = 0;
            measures.angularAcceleration = 0;
        }

        updateNetTorque();  // update net tork values of right and left sde when angle is updated
        htmlUpdateRotationParameters();

        htmlUpdateRotationIndicator()

        draw();             
    };
}

function terminateRotationThread() {
    if(rotationThread) {
        rotationThread.terminate() //finish thread
        rotationThread = null;
    }
}

function terminateFallingThreads() {
    for (const [id, thread] of fallThreads.entries()) {
        thread.terminate(); // close the thread
        fallThreads.delete(id); // delte it from the set
    }
}


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


function saveStateToLocalStorage() {
    const state = {
        balls: balls,
        measures: measures,
        isPaused: isPaused,
        logsList: logsList()
    };
    localStorage.setItem("seesawState", JSON.stringify(state));
}

function loadStateFromLocalStorage() {
    const savedState = localStorage.getItem("seesawState");
    if (savedState) {
        const state = JSON.parse(savedState);
        balls = state.balls || [];
        measures = state.measures || measures;
        isPaused = state.isPaused;

        // Updat UI
        htmlUpdateLeftWeight();
        htmlUpdateRightWeight();
        htmlUpdateLeftRawTorque();
        htmlUpdateRightRawTorque();
        htmlUpdateRotationParameters();
        htmlUpdateNextWeight()
        //continue the therads from where they were left
        if(!isPaused) {
            let loadedAngularVelocity = measures.angularVelocity
            startRotation(loadedAngularVelocity)
            
            for(let i = 0; i < balls.length; i++)
                if(balls[i].falling) 
                    startFalling(balls[i], balls[i].loadedFallSpeed)
        }
        else {
            pauseSimulation();
            draw()
        }

        //laod logs
        loadLogs(state.logsList)
        
    } else {
        console.log("No saved state found.");
        resetSeesaw()
    }


}


window.addEventListener("beforeunload", saveStateToLocalStorage);
window.addEventListener("load", loadStateFromLocalStorage);

 