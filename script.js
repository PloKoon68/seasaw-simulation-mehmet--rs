const canvas = document.getElementById('seasawCnvs');  //main canvas element

//note: this system is assumed to have a square shape canvas (width=height)
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


let ball = {
    r: 5,
    color: '#0e1575ff',
    visible: false
};

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
    if (ball.visible) {
        pdrawBall(ball.x, ball.y, ball.r, ball.color);
    }
}

// ball on mouse cursor
canvas.addEventListener('mousemove', (evt) => {
    const rect = canvas.getBoundingClientRect();
    ball.x = Math.min(92, Math.max(8, ((evt.clientX - rect.left) / rect.width) * 100));
    ball.y = 10;
    ball.visible = true;
    draw();
});

// remove ball when leaves canvas
canvas.addEventListener('mouseleave', () => {
    ball.visible = false;
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

