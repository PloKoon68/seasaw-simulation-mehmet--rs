const canvas = document.getElementById('seasawCnvs');  //main canvas element

//note: this system is assumed to have a square shape canvas (width=height)
//also, fror ease of use, percentage of width-height is used for location unit 
//instead of raw pixel
const LENGTH = canvas.height

const ctx = canvas.getContext('2d');   //for drawing objects in canvas



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

function pdrawBall(cx, cy, r, color) {
    ctx.beginPath();           
    ctx.arc(percentage_to_px(cx), percentage_to_px(cy), percentage_to_px(r), 0, Math.PI * 2); // 2pi for full circle
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}



let balls = []
balls.push({
    x: 0,
    y: 0,
    r: 5,
    color: '#0e1575ff',
    visible: false,
    falling: false,
    fallSpeed: 0,
    targetX: null,  
    targetY: 70
}); 

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw ground
    pfillRectWith(0, 100, 80, 20, '#0d8a41ff');

    // draw pivot triangle
    pdrawShape([[50, 70], [45, 80], [55, 80]], '#5d6767ff');

    // draw seesaw
    pdrawShape([[10, 74], [90, 74], [90, 69], [10, 69]], '#8f5509ff');

    // draw ball if visible
    let lastBallIndex = balls.length
    for(let i = 0; i < lastBallIndex; i++) {
        if(balls[i].falling) {
            console.log("falling: ")
            fall(balls[i])    
        }
        pdrawBall(balls[i].x, balls[i].y, balls[i].r, balls[i].color);
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fall(ball) {
    if (ball.y < ball.targetY) {
        ball.y += ball.fallSpeed;
        ball.fallSpeed += 0.01; // gravity acceleration
        await wait(100);

        draw();
    } else {
        ball.y = ball.targetY;
        ball.falling = false;
        ball.fallSpeed = 0;
        draw();
    }
}

// ball on mouse cursor
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    let lastBallIndex = balls.length-1
    balls[lastBallIndex].x = Math.min(92, Math.max(8, ((event.clientX - rect.left) / rect.width) * 100));
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
    console.log(balls.length-1, " is falling")
    console.log(balls)
    balls.push({
        x: event.clientX,
        y: event.clientY,
        r: 5,
        color: '#0e1575ff',
        visible: false,
        falling: false,
        fallSpeed: 0,
        targetX: null,  
        targetY: 70,
        fallSpeed: 0
    })

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

