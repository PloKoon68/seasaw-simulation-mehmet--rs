import { balls, measures } from './main.js';


export function htmlUpdateRightWeight() {document.getElementById("right-weight").textContent = measures.right_side.weight;}
export function htmlUpdateLeftWeight() {document.getElementById("left-weight").textContent = measures.left_side.weight;}

export function htmlUpdateRightRawTorque() {document.getElementById("right-raw-torque").textContent = measures.right_side.rawTorque.toFixed(0)}
export function htmlUpdateLeftRawTorque() {document.getElementById("left-raw-torque").textContent = measures.left_side.rawTorque.toFixed(0)}

export function htmlUpdateRotationParameters() {
    document.getElementById("right-net-torque").textContent = measures.right_side.netTorque.toFixed(0);
    document.getElementById("left-net-torque").textContent = measures.left_side.netTorque.toFixed(0);


    document.getElementById("angle").textContent = measures.angle.toFixed(2);
    document.getElementById("angular-velocity").textContent = measures.angularVelocity.toFixed(4);
    document.getElementById("angular-acceleration").textContent = measures.angularAcceleration.toFixed(4);
}

export function htmlUpdateNextWeight(){document.getElementById("next-weight").textContent = balls[balls.length-1].weight;}


// update the arrow sign in html
export function htmlUpdateRotationIndicator() {
    const indicator = document.getElementById('rotation-indicator');
    
    if(measures.angularAcceleration > 0 || measures.angularAcceleration < 0) {
        // show the motion
        indicator.classList.add('visible');
        
        if (measures.angularAcceleration > 0) {
            // turn right
            indicator.classList.remove('rotating-left');
            indicator.classList.add('rotating-right');
        } else {
            // turn left
            indicator.classList.remove('rotating-right');
            indicator.classList.add('rotating-left');
        }
    } else {
        // motionless (hide)
        indicator.classList.remove('visible', 'rotating-left', 'rotating-right');
    }
}
