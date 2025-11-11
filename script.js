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


let measures = {
    left_side: {weight: 0, rawTorque: 0},
    right_side: {weight: 0, rawTorque: 0},
    angle: 0
}


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
function calculateDroppedBallPosition(ball, angle) {    // called for each ball when the rotation thread updates the angle
    const radian = angle * Math.PI / 180;
    const ballCenterDistanceFromPlank = PLANK_WIDTH/2 + ball.r

    const dy = Math.sin(radian) * ball.distanceToCenter - Math.cos(radian) * ballCenterDistanceFromPlank
    ball.y = 50 + dy
    const dx = Math.cos(radian) * ball.distanceToCenter + Math.sin(radian) * ballCenterDistanceFromPlank
    ball.x = 50 + dx

}



///////////////////////



let balls = []

function distanceToCenter(coordinate) {
//    return Math.sqrt((percentage_to_px(coordinate[0]) - percentage_to_px(50))**2 + (percentage_to_px(coordinate[1]) - percentage_to_px(50))**2)
    return Math.sqrt((coordinate[0] - 50)**2 + (coordinate[1] - 50)**2)
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

const initialWeight = Math.floor(Math.random() * 10) + 1
const initialRadius = 4 + initialWeight/3
balls.push({ 
    x: 0,
    y: 0,
    r: initialRadius,
    color:  randomDarkColor(),
    visible: false,
    falling: false,
    targetX: null,  
    targetY: 50 - initialRadius - PLANK_WIDTH/2,
    weight: initialWeight,
    distanceToCenter: null
}); 

function create_new_ball(event) {
    const weight = Math.floor(Math.random() * 10) + 1;
    const r = 4 + weight/3;
    balls.push({ 
        x: Math.min(50+PLANK_LENGTH/2, Math.max(50-PLANK_LENGTH/2, ((event.clientX - rect.left) / rect.width) * 100)),
        y: 10,
        r: r,
        color:  randomDarkColor(),
        visible: true,
        falling: false,
        targetX: null,  
        targetY: 50 - r - PLANK_WIDTH/2,
        weight: weight,
        distanceToCenter: null
    }); 
}



const rotateButton = document.querySelector('.pause-button');
function rotateSeesaw() {
    pDrawSeesaw(20); // example: rotate 15 degrees

    console.log("Button clicked!");
}
rotateButton.addEventListener('click', rotateSeesaw);




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
function startFalling(ball) {
    const worker = new Worker('fallThread.js');
    worker.postMessage({
        y: ball.y,
        targetY: ball.targetY,
        weight: ball.weight
    });

    worker.onmessage = function(e) {
        ball.y = e.data.y; // update ball position
        draw();             
        if (e.data.y === ball.targetY) {   //ball reached target, its terminate thread
            ball.distanceToCenter = distanceToCenter([ball.x, ball.y])

            ball.falling = false;
            worker.terminate(); 

            endFalling(ball);
        }
    };
}
function endFalling(ball) {
    //torque calculation: d * w
    const d = distanceToCenter([ball.x, ball.y]);
    ball.distanceToCenter = d;
    const torque = d * ball.weight;
    
    if(ball.x >= 50) {
        measures.right_side.weight += ball.weight;
        measures.right_side.rawTorque += torque;
    }
    else {
        measures.left_side.weight += ball.weight;
        measures.left_side.rawTorque += torque;
    }
    //measures.angle = Math.max(-30, Math.min(30, (measures.right_side.torque - measures.left_side.torque) / 10));


    //start rotating
    draw()
    startRotation()
}


let rotationThread;
function startRotation() {
    rotationThread = new Worker('rotationThread.js');

    const distancesToCenter = balls.map((ball) => ball.distanceToCenter)
    distancesToCenter.pop()

    rotationThread.postMessage({
        measures: measures,
        balls: balls,
        length: PLANK_LENGTH/2
    });

    rotationThread.onmessage = function(e) {
        measures.angle = e.data.angle; // update ball position
        draw();             
    };
}



// ball on mouse cursor
canvas.addEventListener('mousemove', (event) => {
    let lastBallIndex = balls.length-1
    balls[lastBallIndex].x = Math.min(50+PLANK_LENGTH/2, Math.max(50-PLANK_LENGTH/2, ((event.clientX - rect.left) / rect.width) * 100));
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
    balls[balls.length-1].falling = true;

    startFalling(balls[balls.length-1])
    create_new_ball(event)
    //startRotation();
    draw();
});


draw();


/*
ctx.fillStyle = 'black';
ctx.font = '20px Arial';
ctx.fillText('Test text!', 200, 100);
*/

// Clear canvas (wipe everything)
//ctx.clearRect(50, 50, canvas.width, canvas.height);

