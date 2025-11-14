import { LENGTH, ctx, PLANK_LENGTH, PLANK_WIDTH, balls, HEIGHT, measures } from './main.js';


// Draw function
export function draw() {
    ctx.clearRect(0, 0, LENGTH, HEIGHT);

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

export const percentage_to_px = (percentage) => {
    return percentage * LENGTH / 100;
}

export const pfillRectWith = (x, w, y, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(percentage_to_px(x), percentage_to_px(y), percentage_to_px(w), percentage_to_px(h));
}

export const pdrawShape = (coordinates, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(percentage_to_px(coordinates[0][0]), percentage_to_px(coordinates[0][1])); 
    for(let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(percentage_to_px(coordinates[i][0]), percentage_to_px(coordinates[i][1]));
    }
    ctx.closePath();
    ctx.fill();  
}

export function pdrawBall(ball) {
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

export function pDrawSeesaw(angleDegrees) {
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


export function drawDistanceGrid(centerX, centerY) {
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