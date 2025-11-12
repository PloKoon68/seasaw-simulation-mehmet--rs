let L;  //initially obtained fixed variables
let targetAngle, coefficient; //variables that may change dynamically if weights update
let angle;  //initially recieved by user, updated over time, managed by this thread
let angularVelocity = 0, angularAcceleration = 0;  //derivated variables that the thread calculates

let balls;
let netRawTorque;
let totalRawTorque;

const g = 10;  //gravity constant
const gravityAcceleration = 10; //gravity acceleration 
const loopPeriod = 20;

//angularAcceleration = (lw-rw)*cos(alpha)*g / (lw + lr)*L
/*
function calculateConstantCoefficient(leftWeight, rightWeight) {   //the part except cos(angle)
    return (leftWeight-rightWeight) * g / ((leftWeight + rightWeight) * L)
}
    */


function calculateConstantCoefficient() { 
    let nominator = netRawTorque  //τnet​=right∑​(ri)​.(mi)​.g.cos(θ)−left∑​(ri).(​mi).​g.cos(θ)
                                  //since teta angle will change in time, it is a variable that will be pass in the main loop evey in every step

    let denominator = 0;   // I = ∑​mi.ri^2
    for(let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        //weight = m * g
        denominator += ball.weight * ball.distanceToCenter * ball.distanceToCenter;
    }
    denominator /= gravityAcceleration;

    return nominator/denominator;   //τnet​ / I
    
    /*
    let rightTorqueSum = 0, leftTorqueSum = 0;
    for(let i = 0; i < balls.length; i++) {
        if(balls.x > 50)  //ball at right side
            rightTorqueSum += balls[i].weight * balls[i].distanceToCenter;
        else              //ball at left side
            leftTorqueSum += balls[i].weight * balls[i].distanceToCenter;
    }
     */
}

function updateTargetAngle(netRawTorque) {   //the part except cos(angle)
    if(netRawTorque > 0) return 30
    else if(netRawTorque < 0) return -30
    return 0
}


onmessage = function(e) {
    // Check if it's an update message or start message
    if (e.data.type === 'update') {     // {measures, type :'update'}
        let leftWeight = e.data.measures.left_side.weight
        let rightWeight = e.data.measures.right_side.weight

        coefficient = calculateConstantCoefficient(leftWeight, rightWeight)
        targetAngle = updateTargetAngle(leftWeight, rightWeight);

    } else if('initial') {     // {measures, length, type :'initial'}
        // initial setup

        /*
        let leftWeight = e.data.measures.left_side.weight
        let rightWeight = e.data.measures.right_side.weight
        */
        balls = e.data.balls
        netRawTorque = e.data.measures.right_side.rawTorque - e.data.measures.left_side.rawTorque;
        totalRawTorque = e.data.measures.right_side.rawTorque + e.data.measures.left_side.rawTorque;


        angle = e.data.measures.angle
        L = e.data.length
        
        coefficient = calculateConstantCoefficient()
        targetAngle = updateTargetAngle(netRawTorque);

        loop();
    }
};

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop() {
    while (angle !== targetAngle) {
        angularAcceleration = coefficient * Math.cos(angle * Math.PI / 180);
        angularVelocity += angularAcceleration * (loopPeriod/1000);
        angle += angularVelocity;
        
        //finish loop
        if (targetAngle > 0) {
            if(angle > targetAngle) angle = targetAngle  
        }
         if (targetAngle < 0) {
            if(angle < targetAngle) angle = targetAngle  
        }
        else {
            if(Math.abs(targetAngle - angle) < 1) angle = targetAngle      
        }

        postMessage({ angle: angle, targetAngle: targetAngle });  //send  to main.js it will update (rotate)
        await wait(loopPeriod);
    }
    self.close(); // terminate this worker
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