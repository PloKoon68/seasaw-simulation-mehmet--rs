const canvas = document.getElementById('seasawCnvs');  //main canvas element
const cheight = canvas.height
const cwidth = canvas.width

const ctx = canvas.getContext('2d');   //for drawing objects in canvas


//p prefix means percentage, instead of raw pixels
const pHeight = (percentage) => {
    return percentage * cheight / 100;
}
const pWidth = (percentage) => {
    return percentage * cwidth / 100;
}

const pfillRectWith = (x, w, y, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(pWidth(x), pHeight(y), pWidth(w), pHeight(h));
}


const pdrawShape = (coordinates, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pWidth(coordinates[0][0]), pHeight(coordinates[0][1])); 
    for(let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(pWidth(coordinates[i][0]), pHeight(coordinates[i][1]));
    }
    ctx.closePath();
    ctx.fill();  
}

// Draw ground
pfillRectWith(0, 100, 80, 20, '#0d8a41ff')

//draw pivot triangle
pdrawShape([[50, 70], [45, 80], [55, 80]], '#5d6767ff');


const PLANK_LENGTH = 400; 
const PLANK_HEIGHT = 20; 
const CENTER_X = canvas.width / 2; 
const CENTER_Y = canvas.height / 2 + 50;


/*
ctx.fillStyle = 'black';
ctx.font = '20px Arial';
ctx.fillText('Test text!', 200, 100);
*/

// Clear canvas (wipe everything)
//ctx.clearRect(50, 50, canvas.width, canvas.height);

