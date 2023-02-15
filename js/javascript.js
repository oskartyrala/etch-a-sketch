const grid = document.querySelector(".grid");
const inputs = document.querySelectorAll(".top > input");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");
const wipe = document.querySelector(".wipe");
const picker = document.querySelector(".picker");
const modes = document.querySelectorAll(".mode");
const pickerContainer = document.querySelector("#pick");
const rainbow = document.querySelector("#rainbow");
const erase = document.querySelector("#erase");
const shade = document.querySelector(".shade");
const lighten = document.querySelector(".lighten");
const darken = document.querySelector(".darken");
const brushSmall = document.querySelector(".small");
const brushLarge = document.querySelector(".large");
const borderless = document.querySelector(".borderless");
const bordersIcon = document.querySelector(".borderless > .icon");
const bucket = document.querySelector("#bucket");
const bucketIcon = document.querySelector("#bucket > .icon")

// Determines the current mode and "brush" color
let currentColor;
let shadeKeeper;
let brushSize = "small";
let borders = true;
let pixels = [];
pickColor();
markSelected();

// Changes brush size between 1x1 and 3x3
brushSmall.addEventListener("click", () => {
    brushSize = "small";
    brushSmall.classList.add("active");
    brushLarge.classList.remove("active");
    bucketIcon.src = "./img/bucket.svg";
})

brushLarge.addEventListener("click", () => {
    brushSize = "large";
    brushLarge.classList.add("active");
    brushSmall.classList.remove("active");
    bucketIcon.src = "./img/bucket.svg";
})

// Toggles pixel borders
borderless.addEventListener("click", () => {
    for (pixel of pixels) {
        pixel.classList.toggle("noborders");
    }

    if (borders) {
        bordersIcon.src = "./img/borders-on.svg";
        borders = false;
    } else {
        bordersIcon.src = "./img/borders-off.svg";
        borders = true;
    }
})

// Activates the bucket
bucket.addEventListener("click", () => {
    brushSize = "bucket";
        bucketIcon.src = "./img/bucket-active.svg";
        brushLarge.classList.remove("active");
        brushSmall.classList.remove("active");
})

// Changes mode to standard and updates the current "brush" color
picker.addEventListener("input", pickColor);
picker.addEventListener("click", pickColor);

function pickColor() {
    currentMode = "pick";
    pickerContainer.style.backgroundColor = picker.value;
    markSelected();
    toggleShade();
}

function convertToRgb(hex) {
    const hexArray = [hex.slice(-6, -4), hex.slice(-4, -2), hex.slice(-2)];

    const rgbArray = [
        parseInt(hexArray[0], 16),
        parseInt(hexArray[1], 16),
        parseInt(hexArray[2], 16),
        1
    ];

    rgbString = `rgba(${rgbArray.join(", ")})`;
    return rgbString;
}

// Changes mode to erase and changes the color to white;
erase.addEventListener("click", () => {
    currentMode = "erase";
    markSelected();
    toggleShade();
})

// Changes mode to rainbow
rainbow.addEventListener("click", () => {
    currentMode = "rainbow";
    markSelected();
    toggleShade();
})

// Adds a border around the current mode
function markSelected() {
    for (mode of modes) {
        mode.classList.remove("selected");
    }
    document.getElementById(`${currentMode}`).classList.add("selected");
}

// Disables the shade slider when not in pick mode, then switches back to
// last value when back in pick mode.
shade.addEventListener("input", () => {
    shadeKeeper = shade.value;
    if (shade.value === "0") {
        currentColor = convertToRgb(picker.value);
    }
})

function toggleShade() {
    if (currentMode === "pick") {
        shade.style.pointerEvents = "";
        shade.classList.remove("disabled");
        shade.value = shadeKeeper;
        darken.src = "./img/darken-enabled.svg"
        lighten.src = "./img/lighten-enabled.svg"
    } else {
        shade.value = "0";
        shade.classList.add("disabled");
        shade.style.pointerEvents = "none";
        darken.src = "./img/darken-disabled.svg"
        lighten.src = "./img/lighten-disabled.svg"
    }
}

// Creates the grid based on input
createGrid(horizontal, vertical);

for (input of inputs) {
    input.addEventListener("input", () => {
        createGrid(horizontal, vertical);
    })
}

function createGrid(horizontal, vertical) {
    pixels = [];
    grid.textContent = "";

    hValue = Number(horizontal.value);
    vValue = Number(vertical.value);

    if (vValue < 1) {
        vValue = 1;
    } else if (vValue > 100) {
        vValue = 100;
    }

    if (hValue < 1) {
        hValue = 1;
    } else if (hValue > 100) {
        hValue = 100;
    }

    for (let i = 0; i < (hValue * vValue); i++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixel");
        if (!borders) {
            pixel.classList.add("borderless");
        }
        pixel.style.width = (100 / hValue) + "%";
        pixel.style.height = (600 / vValue) + "px";

        pixel.addEventListener("mousedown", (e) => {
            if (e.buttons === 1) {
                e.preventDefault();
                // updateColor(e);
                paintPixels(e);
            }
        })

        pixel.addEventListener("mouseenter", (e) => {
            if (e.buttons === 1) {
                e.preventDefault();
                // updateColor(e);
                paintPixels(e);
            }
        })
        
        pixels.push(pixel);
        grid.appendChild(pixel);
    }
}

function paintPixels(e) {

    // Update color

    currentColor = convertToRgb(picker.value);

    if (currentMode === "rainbow") {
        currentColor = `rgb(${getRGBValue()}, ${getRGBValue()}, 
        ${getRGBValue()})`;
    }

    if (currentMode === "erase") {
        currentColor = "rgba(255, 255, 255, 0)";
    }

    // Brush size logic
    if (brushSize === "bucket") {
        paintBucket(e.target);
    }

    if (brushSize === "large") {
        paintLargeBrush(e.target);
    }

    if (brushSize === "small") {
        paintSinglePixel(pixels.indexOf(e.target));
    }
}





function paintBucket(pixel) {
    const bucketTargetColor = getRgbaFromRgb(pixel.style.backgroundColor);
    const pxIndex = pixels.indexOf(pixel);

        paintAround(pxIndex, bucketTargetColor);
}

function paintAround(pxIndex, bucketTargetColor) {

    // Attempts to paint around the bucket target if the color matches.
    if (getRgbaFromRgb(pixels[pxIndex].style.backgroundColor) === bucketTargetColor) {
        paintSinglePixel(pxIndex);
        if (bucketTargetColor !== currentColor) {
        // Paints pixels on the sides if they don't go over the edge
        if (pxIndex !== 0 && 
            pxIndex % hValue > (pxIndex - 1) % hValue) {
            paintAround(pxIndex - 1, bucketTargetColor);
        }
    
        if (pxIndex % hValue < (pxIndex + 1) % hValue) {
            paintAround(pxIndex + 1, bucketTargetColor);
        }
    
        // Paints pixels on top and bottom if they don't go over the edge
        if (pxIndex - hValue > 0) {
            paintAround(pxIndex - hValue, bucketTargetColor);
        }
    
        if (pxIndex + hValue < hValue * vValue) {
            paintAround(pxIndex + hValue, bucketTargetColor);
        }
        }

    }
}

// Gets a random number to feed into random color in rainbow mode
function getRGBValue() {
    return Math.floor(Math.random() * 255) + 1;
}

// Increases or decreases current color's alpha by 0.1
function shadePixel(pixel) {

    currentColor = convertToRgb(picker.value);

    const pixelColorString = getRgbaFromRgb(pixel.style.backgroundColor);
    let pixelColorArray = pixelColorString.split(", ");
    let alphaValue = Number(pixelColorArray[3].slice(0, -1));

    // Depending on the shade toggle, adjusts the alpha value
    if (shade.value === "-1" && alphaValue < 1) {
        alphaValue += 0.1;
        pixelColorArray[3] = alphaValue + ")";
    } else if (shade.value === "1" && alphaValue > 0) {
        alphaValue -= 0.1;
        pixelColorArray[3] = alphaValue + ")";
    }

    if (!alphaValue) {
        currentColor = "rgba(255, 255, 255, 0)";
    } else {
        const currentColorArray = currentColor.split(", ");
        currentColorArray[3] = pixelColorArray[3];
        currentColor = currentColorArray.join(", ");
    }

    // Combines the new alpha value with the current color and paints the pixel
}

// Paints a single pixel if it exists
function paintSinglePixel(pxIndex) {

    if (shade.value !== "0") {
        shadePixel(pixels[pxIndex]);
    }
    if (pxIndex >= 0 &&
        pxIndex <= hValue * vValue) {

        pixels[pxIndex].style.backgroundColor = currentColor;
    }
}

// Paints around the selected pixel while respecting edges and corners
function paintLargeBrush(pixel) {
    let pxIndex = pixels.indexOf(pixel);

    paintSinglePixel(pxIndex);

    // Paints pixels on top and bottom if they don't go over the edge
    paintSinglePixel(pxIndex - hValue);
    paintSinglePixel(pxIndex + hValue);

        // Paints pixels on the sides if they don't go over the edge
    if (pxIndex !== 0 &&
        pxIndex % hValue > (pxIndex - 1) % hValue) {
        paintSinglePixel(pxIndex - 1 - hValue);
        paintSinglePixel(pxIndex - 1);
        paintSinglePixel(pxIndex - 1 + hValue);
    }
    if (pxIndex % hValue < (pxIndex + 1) % hValue) {
        paintSinglePixel(pxIndex + 1 - hValue);
        paintSinglePixel(pxIndex + 1);
        paintSinglePixel(pxIndex + 1 + hValue);
    }
}

function getRgbaFromRgb(rgbString) {
    // If the pixel hasn't been colored yet, its backgroundColor will return empty. In that case, we assume fully transparent white.
    if (!rgbString) {
        rgbString = "rgba(255, 255, 255, 0)";
    };

    const rgbArray = rgbString.split(", ");
    if (!rgbArray[3]) {
        rgbArray[2] = rgbArray[2].slice(0, -1);
        rgbArray[3] = "1)";
    };
    rgbArray[0] = rgbArray[0].replace("rgb(", "rgba(");
    rgbaString = rgbArray.join(", ");
    return rgbaString;
}

// Wipes the board
wipe.addEventListener("click", () => {
    createGrid(horizontal, vertical);
})