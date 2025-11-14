import { measures, balls, fallThreads, rotationThread, setRotationThread } from '../main.js';
import { updateNetTorque } from '../physics.js';

import { htmlUpdateLeftWeight, htmlUpdateRightWeight, htmlUpdateLeftRawTorque, htmlUpdateRightRawTorque, htmlUpdateRotationParameters, htmlUpdateRotationIndicator     } from '../ui_updates.js';
import { draw } from '../drawing.js';
import { playImpactSound, addLog } from '../actions.js';
import { distanceToCenterFromBallTouchPoint, horizontalDistanceToPivot, updateDroppedBallPositionY, calculateBalltargetY, updateFallingBallTarget  } from '../physics.js';
 


export function startFalling(ball, loadedFallSpeed) {
    const fallThread = new Worker('scripts/threads/fallThread.js');

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

export function updateTorque(ball) {
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


export function startRotation(loadedAngularVelocity) {

    setRotationThread(new Worker('scripts/threads/rotationThread.js'));
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

export function terminateRotationThread() {
    console.log("gde")
    if (rotationThread) {
        rotationThread.postMessage({ type: 'terminate' });   // sadece mesaj gönder

        // Worker’ın düzgün kapanması için küçük delay
        setTimeout(() => {
            rotationThread.terminate();
            setRotationThread(null);
        }, 20);   // 10–30ms yeterli
    }
}

export function terminateFallingThreads() {
    for (const [id, thread] of fallThreads.entries()) {
        thread.terminate(); // close the thread
        fallThreads.delete(id); // delte it from the set
    }
}

