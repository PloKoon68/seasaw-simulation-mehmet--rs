import { percentage_to_px } from './drawing.js';
import { measures, rotationThread, pauseButton, balls } from './main.js';
import { startFalling, startRotation, terminateFallingThreads, terminateRotationThread  } from './threads/threadOperations.js';
 

//pause - continue
export function pauseSimulation() {
    // Delete all active threasd
    if (rotationThread)
        terminateRotationThread();

    terminateFallingThreads();

    //update in html
    pauseButton.textContent = "Continue";
    pauseButton.classList.add("continue-button");
    pauseButton.classList.remove("pause-button");
    pauseButton.style.backgroundColor = "#27ae60";
}

export function continueSimulation() {

    //continue the therads from where they were left
    let lastAngularVelocity = measures.angularVelocity
    startRotation(lastAngularVelocity)
    
    for(let i = 0; i < balls.length; i++)
        if(balls[i].falling) 
            startFalling(balls[i], balls[i].loadedFallSpeed)

    //update in html
    pauseButton.textContent = "Pause";
    pauseButton.classList.add("pause-button");
    pauseButton.classList.remove("continue-button");
    pauseButton.style.backgroundColor = "rgb(229, 222, 14)";

}





//log panel functions
export function addLog(weight, side, distance) {
    const logsPanel = document.querySelector('.logs-panel');
    
    const log = document.createElement('div');
    log.className = 'log-item';
    distance = percentage_to_px(distance.toFixed(2))
    log.textContent = `${weight}kg laned on ${side} side at ${distance}px from pivot center`;
    
    logsPanel.appendChild(log);
    logsPanel.scrollTop = logsPanel.scrollHeight;
}

export function logsList() {
    const logsPanel = document.querySelector('.logs-panel');
    const logs = [];
    
    logsPanel.querySelectorAll('.log-item').forEach(log => {
        logs.push(log.textContent);
    });
    
    return logs;
}




//audio actions

let audioContext = null;
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

//generate sound with intensity proportionate to the weight
export function playImpactSound(weight) {
    try {
        const ctx = getAudioContext();
        
        
        const intensity = (weight**3) / 10; // between 0 and 1
        
        // Oscillator (tone generator)
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Creaet connection
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // frequence: heavy = low frequence, light objects = high frequence
        const baseFrequency = 150 - (weight * 10); // 50-140 Hz
        oscillator.frequency.setValueAtTime(baseFrequency, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            baseFrequency * 0.5, 
            ctx.currentTime + 0.1
        );
        
        oscillator.type = 'triangle';
        
        const volume = 0.2 + (intensity * 0.3); // 0.2 - 0.5 arası
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}
