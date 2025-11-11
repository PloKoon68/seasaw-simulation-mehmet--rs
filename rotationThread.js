let L;  //initially obtained fixed variables
let targetAngle, coefficient; //variables that may change dynamically if weights update
let angle;  //initially recieved by user, updated over time, managed by this thread
let angularVelocity = 0, angularAcceleration = 0;  //derivated variables that the thread calculates

const g = 0.1;  //gravity constant


//angularAcceleration = (lw-rw)*cos(alpha)*g / (lw + lr)*L

function calculateConstantCoefficient(leftWeight, rightWeight) {   //the part except cos(angle)
    return (leftWeight-rightWeight) * g / ((leftWeight + rightWeight) * L)
}
function updateTargetAngle(leftWeight, rightWeight) {   //the part except cos(angle)
    if(leftWeight === rightWeight) return 0
    else if(leftWeight > rightWeight) return -30
    return 30
}


onmessage = function(e) {
    // Check if it's an update message or start message
    if (e.data.type === 'update') {     // {measures, type :'update'}
        let leftWeight = e.data.measures.weights.left
        let rightWeight = e.data.measures.weights.right

        coefficient = calculateConstantCoefficien(leftWeight, rightWeight)
        targetAngle = updateTargetAngle(leftWeight, rightWeight);

    } else if('initial') {     // {measures, length, type :'initial'}
        // initial setup

        let leftWeight = e.data.measures.weights.left
        let rightWeight = e.data.measures.weights.right

        angle = e.data.measures.angle
        L = e.data.length
        
        coefficient = calculateConstantCoefficien(leftWeight, rightWeight)
        targetAngle = updateTargetAngle(leftWeight, rightWeight);


        loop();
    }
};

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop() {
    while (alpha != targetAngle) {
        angularAcceleration = coefficient * Math.cos(angle);
        angularVelocity += angularAcceleration;
        angle += angularVelocity;
        
        if (angle > targetAngle) angle = targetAngle  //finish loop

        postMessage({ angle });  //send  to main.js it will update (rotate)
        await wait(2000);
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