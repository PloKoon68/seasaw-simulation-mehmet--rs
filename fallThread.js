onmessage = function(e) {
    let { y, targetY } = e.data;

    let fallSpeed = 0;
    let acceleration = 0.1;   //gravity acceleration
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function loop() {

        while (y < targetY) {
            fallSpeed += acceleration;
            y += fallSpeed;
            if(y > targetY) y = targetY
            postMessage({ y }); // send new vertical position to main thread
            await wait(20)
        }   
        postMessage({ y: Math.round(targetY) }); 

    }

    loop();
};
