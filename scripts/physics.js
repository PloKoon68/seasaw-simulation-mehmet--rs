import { percentage_to_px } from './drawing.js';
import { PLANK_WIDTH, measures, fallThreads } from './main.js';


export function calculateBalltargetY(ball, angle) {    // called for each ball when the rotation thread updates the angle
    const radian = angle * Math.PI / 180;
    const newTargetY = (Math.tan(radian) * (ball.x - 50)) + (-(PLANK_WIDTH/2)/Math.cos(radian) - ball.r) + 50
    ball.targetY = newTargetY
}

export function updateFallingBallTarget(ball) {
    const thread = fallThreads.get(ball.id);
    if (thread) {
        thread.postMessage({
            type: 'update',
            targetY: ball.targetY
        });
    }
}

export function updateDroppedBallPositionY(ball, angle) {    // called for each ball when the rotation thread updates the angle
    const radian = angle * Math.PI / 180;

    const newY = ball.d * Math.sin(radian) - (ball.r + PLANK_WIDTH/2) * Math.cos(radian) + 50;
    const newX = ball.d * Math.cos(radian) + (ball.r + PLANK_WIDTH/2) * Math.sin(radian) + 50;

    ball.y = newY
    ball.x = newX
}

export function horizontalDistanceToPivot(ball) {
    const radian = measures.angle * Math.PI / 180;

    const dInPixel = percentage_to_px(ball.d)  //convert to pixel

    return dInPixel * Math.cos(radian) + Math.sin(radian) * (PLANK_WIDTH/2 + ball.r)
}

export function updateNetTorque() {
    const radian = measures.angle * Math.PI / 180;
    
    measures.right_side.netTorque = measures.right_side.rawTorque * Math.cos(radian)
    measures.left_side.netTorque = measures.left_side.rawTorque * Math.cos(radian)
}

export function distanceToCenterFromBallTouchPoint(bx, by, r) {
    const radian = measures.angle * Math.PI / 180   // get the current angle

    const dPerpendicularToPlankFromCenter = r + PLANK_WIDTH/2
    const dx = bx - dPerpendicularToPlankFromCenter * Math.sin(radian);
    const dy = by + dPerpendicularToPlankFromCenter * Math.cos(radian);   
    const d = Math.sqrt((dx - 50)**2 + (dy - 50)**2);  //returns positive anyway
    return dx < 50? -d: d;   //if on the left side of the plank, return negative d
}
