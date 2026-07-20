const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');

// Controls
const sliceCountInput = document.getElementById('sliceCount');
const rgbSplitInput = document.getElementById('rgbSplit');
const brightnessInput = document.getElementById('brightness');
const glitchBtn = document.getElementById('glitchBtn');
const downloadBtn = document.getElementById('downloadBtn');

let originalImage = null;

// Initialize with a generated sample pattern so it's not blank at launch
window.addEventListener('DOMContentLoaded', () => {
    createPlaceholderPattern();
});

function createPlaceholderPattern() {
    canvas.width = 600;
    canvas.height = 400;
    // Draw an abstract gradient
    let grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#ff0055');
    grad.addColorStop(0.5, '#000000');
    grad.addColorStop(1, '#00ffcc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UPLOAD A JPG TO START', 300, 210);
    
    // Save state as image object
    originalImage = new Image();
    originalImage.src = canvas.toDataURL();
    originalImage.onload = applyGlitch;
}

// Handle image uploads
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage = new Image();
        originalImage.onload = function() {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            applyGlitch();
        }
        originalImage.src = event.target.result;
    }
    if(e.target.files[0]) {
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Update slider value displays and trigger live updates
const updateVal = (input, id) => {
    document.getElementById(id).textContent = input.value;
    input.addEventListener('input', () => {
        document.getElementById(id).textContent = input.value;
        applyGlitch();
    });
};
updateVal(sliceCountInput, 'sliceCountVal');
updateVal(rgbSplitInput, 'rgbSplitVal');
updateVal(brightnessInput, 'brightnessVal');

glitchBtn.addEventListener('click', applyGlitch);

function applyGlitch() {
    if (!originalImage) return;

    const slices = parseInt(sliceCountInput.value);
    const offsetMax = parseInt(rgbSplitInput.value);
    const overexposure = parseInt(brightnessInput.value);

    // Reset canvas to pristine image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    if (slices === 0 && offsetMax === 0 && overexposure === 0) return;

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Pass 1: Pixel Manipulation (RGB Channel Splitting and Overexposure)
    if (offsetMax > 0 || overexposure > 0) {
        let pixels = imgData.data;
        let width = imgData.width;
        let height = imgData.height;
        let shiftBytes = offsetMax * 4;

        for (let i = 0; i < pixels.length; i += 4) {
            // Apply RGB channel shifting
            if (i + shiftBytes < pixels.length) {
                pixels[i] = pixels[i + shiftBytes]; // Shift red channel
            }
            // Apply brightness overexposure factor
            if (overexposure > 0) {
                pixels[i] = Math.min(255, pixels[i] + overexposure);
                pixels[i+1] = Math.min(255, pixels[i+1] + overexposure);
                pixels[i+2] = Math.min(255, pixels[i+2] + overexposure);
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    // Pass 2: Canvas Slice displacement
    for (let i = 0; i < slices; i++) {
        // Grab a random horizontal band
        let sliceY = Math.random() * canvas.height;
        let sliceH = Math.min(Math.random() * (canvas.height / 5), canvas.height - sliceY);
        let shiftX = (Math.random() - 0.5) * (canvas.width * 0.1);

        // Draw the sliced section offset left or right
        ctx.drawImage(
            canvas, 
            0, sliceY, canvas.width, sliceH, 
            shiftX, sliceY, canvas.width, sliceH
        );
    }
}

// Download implementation
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'glitched-art.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
});
