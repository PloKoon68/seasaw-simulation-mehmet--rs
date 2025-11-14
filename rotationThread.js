let targetAngle, coefficient; //variables that may change dynamically if weights update
let angle;  //initially recieved by user, updated over time, managed by this thread
let angularVelocity = 0, angularAcceleration = 0;  //derivated variables that the thread calculates

let balls;

const gravityAcceleration = 10; //gravity acceleration 
const loopPeriod = 20;

function calculateConstantCoefficient(netRawTorque) { 
    let nominator = netRawTorque  //τnet​=right∑​(ri)​.(mi)​.g.cos(θ)−left∑​(ri).(​mi).​g.cos(θ)
                                  //since teta angle will change in time, it is a variable that will be pass in the main loop evey in every step

    let denominator = 0;   // I = ∑​mi.ri^2
    for(let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        //weight = m * g
        denominator += ball.weight * ball.d * ball.d;
    }
    denominator /= gravityAcceleration;

        if (denominator === 0) {
        return 0;
    }
    return nominator/denominator;   //τnet​ / I
}

function updateTargetAngle(netRawTorque) {   //the part except cos(angle)
    if(netRawTorque > 0) return 30
    else if(netRawTorque < 0) return -30
    return 0
}


onmessage = function(e) {
    // Check if it's an update message or start message

    if (e.data.type === 'update') {
        balls = e.data.balls;
        const netRawTorque = e.data.measures.right_side.rawTorque - e.data.measures.left_side.rawTorque;
        coefficient = calculateConstantCoefficient(netRawTorque)
        targetAngle = updateTargetAngle(netRawTorque);
    } else if(e.data.type === 'initial') { 
        // initial setup
        balls = e.data.balls
        angle = e.data.measures.angle
        const netRawTorque = e.data.measures.right_side.rawTorque - e.data.measures.left_side.rawTorque;

        coefficient = calculateConstantCoefficient(netRawTorque)
        targetAngle = updateTargetAngle(netRawTorque);

        //if loaded saved state, continue from last velocity
        if(e.data.loadedAngularVelocity) angularVelocity = e.data.loadedAngularVelocity

        loop();
    }
};

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop() {
    let finished = false;

    while (!finished) {
        if(Math.abs(angle) > 30) {
            angularAcceleration = 0;
            angularVelocity = 0;
        }

        angularAcceleration = coefficient * Math.cos(angle * Math.PI / 180);
        angularVelocity += angularAcceleration * (loopPeriod/1000);
        angle += angularVelocity;
        
        //finish loop
        if (targetAngle > 0) {
            if(angle > targetAngle) {
                angle = targetAngle 
                finished = true 
            }
        }
         if (targetAngle < 0) {
            if(angle < targetAngle) {
                angle = targetAngle  
                finished = true 
            }
        }
        else {
            if(Math.abs(targetAngle - angle) < 1) {
                angle = targetAngle      
                finished = true 
            }
        }

        postMessage({ finished: finished, angle: angle, angularAcceleration: angularAcceleration, angularVelocity: angularVelocity });  //send  to main.js it will update (rotate)
        await wait(loopPeriod);
    }

}




/*
pseudo code:

if (ağırlıklar değişti)   //
    coefficient = calculateConstantCoefficien(leftWeight, rightWeight)
    targetAngle = updateTargetAngle(leftWeight, rightWeight);


while(alpha != targetAngle) {   //until reaching target angle (in our case 30 or -30)
    //update angular acceleration in every step (since angle changes every time)
    angularAcceleration = coefficient * Math.cos(angle);
    angularVelocity += angularAcceleration;
    angle += angularVelocity;
    sendNewAngle //send  to main.js it will update (rotate)
}

*/