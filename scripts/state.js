import { LENGTH, ctx, PLANK_LENGTH, PLANK_WIDTH, balls, HEIGHT, isPaused , measures, setMeasures, setBalls, setIsPaused, ballCount, setBallCount } from './main.js';
import { htmlUpdateLeftWeight, htmlUpdateRightWeight, htmlUpdateLeftRawTorque, htmlUpdateRightRawTorque, htmlUpdateRotationParameters, htmlUpdateNextWeight    } from './ui_updates.js';
import { startRotation, terminateFallingThreads, terminateRotationThread  } from './threads/threadOperations.js';
import { continueSimulation   } from './actions.js';
import { draw } from './drawing.js';

 
export function saveStateToLocalStorage() {
    const state = {
        balls: balls,
        measures: measures,
        isPaused: isPaused,
        logsList: logsList()
    };
    localStorage.setItem("seesawState", JSON.stringify(state));
}


export function loadStateFromLocalStorage() {
    const savedState = localStorage.getItem("seesawState");
    if (savedState) {
        const state = JSON.parse(savedState);
        
        setBalls(state.balls)
        setMeasures(state.measures)
        setIsPaused(state.isPaused)        

        // Updat UI
        htmlUpdateLeftWeight();
        htmlUpdateRightWeight();
        htmlUpdateLeftRawTorque();
        htmlUpdateRightRawTorque();
        htmlUpdateRotationParameters();
        htmlUpdateNextWeight()
        //continue the therads from where they were left
        if(!isPaused) {
            let loadedAngularVelocity = measures.angularVelocity
            startRotation(loadedAngularVelocity)
            
            for(let i = 0; i < balls.length; i++)
                if(balls[i].falling) 
                    startFalling(balls[i], balls[i].loadedFallSpeed)
        }
        else {
            pauseSimulation();
            draw()
        }

        //laod logs
        loadLogs(state.logsList)
        
    } else {
        console.log("No saved state found.");
        resetSeesaw()
    }
}

export function randomDarkColor() {
    let r, g, b;
    do {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
    } while ((r + g + b) / 3 > 180); // keep looping if it's too bright

    return `rgb(${r}, ${g}, ${b})`;
}

function loadLogs(logsList) {
    const logsPanel = document.querySelector('.logs-panel');
    
    logsList.forEach(logText => {
        const log = document.createElement('div');
        log.className = 'log-item';
        log.textContent = logText;
        logsPanel.appendChild(log);
    });
    logsPanel.scrollTop = logsPanel.scrollHeight;
}



export function resetSeesaw() {
    setIsPaused(false);
    continueSimulation()

    // clean Localstorage
    terminateFallingThreads()
    terminateRotationThread()
    // Reset balls and measuers
    setBalls([]);
    setMeasures({
        left_side: {weight: 0, rawTorque: 0, netTorque: 0},
        right_side: {weight: 0, rawTorque: 0, netTorque: 0},
        angle: 0,
        angularAcceleration: 0,
        angularVelocity: 0
    })

    // Stop all threads
    localStorage.clear();


    // New initial ball
    const initialWeight = Math.floor(Math.random() * 10) + 1;
    const initialRadius = 4 + initialWeight / 3;
    setBallCount(0);
    balls.push({
        x: 0,
        y: 0,
        r: initialRadius,
        color: randomDarkColor(),
        visible: false,
        falling: false,
        savedFallSpeed: 0,
        targetX: null,
        targetY: null,
        weight: initialWeight,
        d: null,
        onRightSide: null,
        id: ballCount
    });
    setBallCount(1);


    htmlUpdateNextWeight();
    htmlUpdateLeftWeight();
    htmlUpdateRightWeight();
    htmlUpdateLeftRawTorque();
    htmlUpdateRightRawTorque();
    htmlUpdateRotationParameters();

    document.querySelector('.logs-panel').innerHTML = '';
    draw();
}

