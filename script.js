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
    fallThreads.forEach(thread => thread.terminate());
    fallThreads.clear();
    if (rotationThread) {
        rotationThread.terminate();
        rotationThread = null;
    }

    // clean Localstorage
    localStorage.removeItem("seesawState");

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

    draw();
}




const pauseButton = document.getElementById("pause-button");

pauseButton.addEventListener('click', function() {
    if (this.id === 'pause-button') {
        // Eğer butona tıklandığında ID'si 'pause-button' ise
        this.textContent = 'Continue';
        this.id = 'continue-button';
    } else {
        // Eğer butona tıklandığında ID'si 'continue-button' ise
        this.textContent = 'Pause';
        this.id = 'pause-button';
    }
})

pauseButton.addEventListener("click", () => {
    if (!isPaused) {
        pauseSimulation();
    } else {
        continueSimulation();
    }
    isPaused = !isPaused;
});


function pauseSimulation() {

    console.log("pause ettim")
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
    console.log("bastım ")
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
console.log("d: ", document.getElementsByClassName("continue-button")[0])


//////////////////////////////////////////////

function htmlUpdateRightWeight() {document.getElementById("right-weight").textContent = measures.right_side.weight;}
function htmlUpdateLeftWeight() {document.getElementById("left-weight").textContent = measures.left_side.weight;}

function htmlUpdateRightRawTorque() {document.getElementById("right-raw-torque").textContent = measures.right_side.rawTorque.toFixed(1);}
function htmlUpdateLeftRawTorque() {document.getElementById("left-raw-torque").textContent = measures.left_side.rawTorque.toFixed(1);}

function htmlUpdateRotationParameters() {
    document.getElementById("right-net-torque").textContent = measures.right_side.netTorque.toFixed(2);
    document.getElementById("left-net-torque").textContent = measures.left_side.netTorque.toFixed(2);


    document.getElementById("angle").textContent = measures.angle.toFixed(2);
    document.getElementById("angular-velocity").textContent = measures.angularVelocity.toFixed(4);
    document.getElementById("angular-acceleration").textContent = measures.angularAcceleration.toFixed(4);
}

function htmlUpdateNextWeight(){document.getElementById("next-weight").textContent = balls[balls.length-1].weight;}




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
    return ball.d * Math.cos(radian) + Math.sin(radian) * (PLANK_WIDTH/2 + ball.r)
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

            ball.d = distanceToCenterFromBallTouchPoint(ball.x, ball.y, ball.r);  //d is negative if ball is on the left arm of plank
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
    console.log("girdim")

    rotationThread = new Worker('rotationThread.js');
    console.log("threade başlıyorum:", balls, loadedAngularVelocity, rotationThread)
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
  
            //angular velocity and acceleration becomes 0
            measures.angularVelocity = 0;
            measures.angularAcceleration = 0;
        }

        updateNetTorque();  // update net tork values of right and left sde when angle is updated
        htmlUpdateRotationParameters();

        draw();             
    };
}

function terminateRotationThread() {
    rotationThread.terminate() //finish thread
    rotationThread = null;
}

function terminateFallingThreads() {
    for (const [id, thread] of fallThreads.entries()) {
        thread.terminate(); // close the thread
        fallThreads.delete(id); // delte it from the set
    }
}


console.log(balls)
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




/*
ctx.fillStyle = 'black';
ctx.font = '20px Arial';
ctx.fillText('Test text!', 200, 100);
*/

// Clear canvas (wipe everything)
//ctx.clearRect(50, 50, canvas.width, canvas.height);


function saveStateToLocalStorage() {
    const state = {
        balls: balls,
        measures: measures,
        isPaused: isPaused
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
        console.log("pas:" , isPaused)

        // Updat UI
        htmlUpdateLeftWeight();
        htmlUpdateRightWeight();
        htmlUpdateLeftRawTorque();
        htmlUpdateRightRawTorque();
        htmlUpdateRotationParameters();

//pauseSimulation
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
        
    } else {
        console.log("No saved state found.");
        resetSeesaw()
    }
}


window.addEventListener("beforeunload", saveStateToLocalStorage);
window.addEventListener("load", loadStateFromLocalStorage);

