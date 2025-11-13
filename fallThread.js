let fallSpeed = 0;
const gravityAcceleration = 10;   //gravity acceleration
const loopPeriod = 20;   //20ms

let dynamicTargetY;

onmessage = function(e) {
    dynamicTargetY = e.data.targetY;   //targetY may update during fall (if plank is keep rotating at the same tim)
    if(e.data.type === 'initial')  {  //only staty the thread starts
        let y = e.data.y;
        loop(y);
    }
};

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop(y) {
    while (true) {
        fallSpeed += gravityAcceleration * (loopPeriod/1000);
        y += fallSpeed;
        if(y > dynamicTargetY) {
            postMessage({ y: dynamicTargetY, done: true }); // send new vertical position to main thread
            break;
        }
        postMessage({ y }); // send new vertical position to main thread
        await wait(loopPeriod)
    }   

}

	
