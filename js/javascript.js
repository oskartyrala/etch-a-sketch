const grid = document.querySelector(".grid");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");
const wipe = document.querySelector(".wipe");
const modes = document.querySelectorAll(".mode");
const pickerContainer = document.querySelector("#standard");
const picker = document.querySelector(".picker");
const slider = document.querySelector(".slider");
const lightenIcon = document.querySelector(".lighten");
const darkenIcon = document.querySelector(".darken");
const brushes = document.querySelectorAll("button.brush");
const borderless = document.querySelector(".borderless");

let pixels = [];
let currentMode;
let currentColor;
let shadeKeeper;
let brushSize = "small";
let pxBorders = true;

// Set up the initial state
setMode("standard");
pickColor();
createGrid(horizontal, vertical);

// Create grid based on user input. Limit grid size to between 1x1 and 100x100.
// Add listeners to pixels to enable painting.
horizontal.addEventListener("input", () => createGrid(horizontal, vertical));
vertical.addEventListener("input", () => createGrid(horizontal, vertical));

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
        if (!pxBorders) {
            pixel.classList.add("noborders");
        }
        
        pixel.style.width = (600 / hValue) + "px";
        pixel.style.height = (600 / vValue) + "px";

        pixel.addEventListener("mousedown", (e) => {

            const pxIndex = pixels.indexOf(e.target);

            if (e.buttons === 1) {
                e.preventDefault();
                paintPixels(pxIndex);
            }
        })

        pixel.addEventListener("mouseenter", (e) => {

            const pxIndex = pixels.indexOf(e.target);

            if (brushSize === "small") {
                addBorder(pxIndex, "top");
                addBorder(pxIndex, "bottom");
                addBorder(pxIndex, "left");
                addBorder(pxIndex, "right");
            }
            
            if (brushSize === "large") {
                outlineLargeBrush(pxIndex);
            }
    
            if (brushSize === "bucket") {
                outlineBucket(pxIndex);
            }

            if (e.buttons === 1) {
                e.preventDefault();
                paintPixels(pxIndex);
            }
        })
    
        pixel.addEventListener("mouseleave", () => {
            removeOutline();
        })
                
        pixels.push(pixel);
        grid.appendChild(pixel);
    }
}

// Add borders around the area that will be painted.
// This function accepts one side argument instead of multiple to make it easier
// to generate random colors for each border in random mode.
// The function being called separately for each side means the border color
// will get randomly generated anew each time.
function addBorder(pxIndex, side) {

    let borderColor;

    if (currentMode === "standard") {
        borderColor = getRgbaFromHex(picker.value);
    } else if (currentMode === "erase") {
        borderColor = "rgba(255, 255, 255, 1)";
    } else if (currentMode === "random") {
        borderColor = `rgb(${getRandomRgbValue()}, ${getRandomRgbValue()}, 
        ${getRandomRgbValue()})`;
    }

    if (pxIndex >= 0 &&
        pxIndex < hValue * vValue) {

            switch (side) {
                case "top":
                    pixels[pxIndex].style.borderTop = `3px double ${borderColor}`;
                    break;

                case "bottom":
                    pixels[pxIndex].style.borderBottom = `3px double ${borderColor}`;
                    break;

                case "left":
                    pixels[pxIndex].style.borderLeft = `3px double ${borderColor}`;
                    break;

                case "right":
                    pixels[pxIndex].style.borderRight = `3px double ${borderColor}`;
                    break;
            }

        // If the pixel doesn't exist, clip the outline on top and bottom accordingly.
        } else {

            switch (side) {
                case "top":
                    pixels[pxIndex + hValue].style.borderTop = `3px double ${borderColor}`;
                    break;

                case "bottom":
                    pixels[pxIndex - hValue].style.borderBottom = `3px double ${borderColor}`;
                    break;
            }
        }
}

// Show an outline around the area that will be painted with the large brush.
function outlineLargeBrush(pxIndex) {

    // Outline pixels on top and bottom if they don't go over the edge
    // (top and bottom edge logic inside addBorder).
 
    addBorder(pxIndex - hValue, "top");
    addBorder(pxIndex + hValue, "bottom");

    // Outline pixels on the sides. If at the edge of the grid,
    // clip the outline accordingly:
    // Left side
    if (pxIndex !== 0 &&
        pxIndex % hValue > (pxIndex - 1) % hValue) {
        addBorder(pxIndex - 1 - hValue, "top");
        addBorder(pxIndex - 1 - hValue, "left");
        addBorder(pxIndex - 1, "left");
        addBorder(pxIndex - 1 + hValue, "bottom");
        addBorder(pxIndex - 1 + hValue, "left");
    } else {
        addBorder(pxIndex - hValue, "left");
        addBorder(pxIndex, "left");
        addBorder(pxIndex + hValue, "left");
    }

    // Right side
    if (pxIndex % hValue < (pxIndex + 1) % hValue) {
        addBorder(pxIndex + 1 - hValue, "top");
        addBorder(pxIndex + 1 - hValue, "right");
        addBorder(pxIndex + 1, "right");
        addBorder(pxIndex + 1 + hValue, "bottom");
        addBorder(pxIndex + 1 + hValue, "right");
    } else {
        addBorder(pxIndex - hValue, "right");
        addBorder(pxIndex, "right");
        addBorder(pxIndex + hValue, "right");
    }
}

// Show an outline around the area that will be painted with the bucket.
function outlineBucket(pxIndex) {
    const bucketTargetColor = getRgbaFromRgb(pixels[pxIndex].style.backgroundColor);
    outlineToEdge(pxIndex, bucketTargetColor);
}

function outlineToEdge(pxIndex, bucketTargetColor) {

    const adjacentPxColor = getRgbaFromRgb(pixels[pxIndex].style.backgroundColor);

    // Keep checking as long as the color matches with the target pixel.
    if (adjacentPxColor === bucketTargetColor) {
        
        // Only check pixels that haven't been checked yet. Checked pixels will
        // have the hover class.
        if (!(pixels[pxIndex].classList.contains("hover"))) {

            pixels[pxIndex].classList.add("hover");

            // Check pixels on the sides if they don't go over the edge.
            if (pxIndex !== 0 && 
                pxIndex % hValue > (pxIndex - 1) % hValue &&
                getRgbaFromRgb(pixels[pxIndex - 1].style.backgroundColor) === bucketTargetColor) {

                outlineToEdge(pxIndex - 1, bucketTargetColor);

            } else {
                addBorder(pxIndex, "left");
            }
        
            if (pxIndex % hValue < (pxIndex + 1) % hValue &&
                getRgbaFromRgb(pixels[pxIndex + 1].style.backgroundColor) === bucketTargetColor) {

                outlineToEdge(pxIndex + 1, bucketTargetColor);

            } else {
                addBorder(pxIndex, "right");
            }
        
            // Check pixels on top and bottom if they don't go over the edge.
            if (pxIndex - hValue >= 0 &&
                getRgbaFromRgb(pixels[pxIndex - hValue].style.backgroundColor) === bucketTargetColor) {
                outlineToEdge(pxIndex - hValue, bucketTargetColor);
            } else {
                addBorder(pxIndex, "top");
            }
        
            if (pxIndex + hValue < hValue * vValue &&
                getRgbaFromRgb(pixels[pxIndex + hValue].style.backgroundColor) === bucketTargetColor) {
                outlineToEdge(pxIndex + hValue, bucketTargetColor);
            } else {
                addBorder(pxIndex, "bottom");
            }
        }
    }
}

// Remove the outline from all pixels (triggered when the mouse leaves a pixel)
function removeOutline() {
    for (pixel of pixels) {
        pixel.classList.remove("hover");
        pixel.style.border = "";
    }
}

// Wipe the board clean
wipe.addEventListener("click", () => createGrid(horizontal, vertical));

// Change the current mode
for (mode of modes) {
    mode.addEventListener("click", (e) => {
        setMode(e.currentTarget.id);
    })
}

function setMode(newMode) {
    currentMode = newMode;
    markSelected(newMode);
    toggleShade();
    updateColor();
}

// Place a border around the selected mode
function markSelected(newMode) {
    for (mode of modes) {
        mode.classList.remove("selected");
    }
    document.getElementById(newMode).classList.add("selected");
}

// In erase and random mode, lock the shading toggle. They don't currently
// interact well together. When back in standard mode, set toggle to the 
// previous value.
slider.addEventListener("input", () => {
    shadeKeeper = slider.value;
    if (slider.value === "0") {
        currentColor = getRgbaFromHex(picker.value);
    }
})

function toggleShade() {
    if (currentMode === "standard") {
        slider.style.pointerEvents = "";
        slider.classList.remove("disabled");
        slider.value = shadeKeeper;
        darkenIcon.src = "./img/darken-enabled.svg";
        lightenIcon.src = "./img/lighten-enabled.svg";

    } else {
        slider.value = "0";
        slider.classList.add("disabled");
        slider.style.pointerEvents = "none";
        darkenIcon.src = "./img/darken-disabled.svg";
        lightenIcon.src = "./img/lighten-disabled.svg";
    }
}

// Use the picker to select a color and reflect the choice on the button.
picker.addEventListener("input", pickColor);
picker.addEventListener("click", pickColor);

function pickColor() {
    pickerContainer.style.backgroundColor = picker.value;
    updateColor();
}

// Select the brush size: small, large, or bucket.
for (brush of brushes) {
    brush.addEventListener("click", (e) => {
        brushSize = e.currentTarget.id;
        for (brush of brushes) {
            brush.classList.remove("active");
        };
        e.currentTarget.classList.add("active");
    })
}

// Toggle pixel borders.
borderless.addEventListener("click", () => {
    for (pixel of pixels) {
        pixel.classList.toggle("noborders");
    }
    borderless.classList.toggle("active");

    if (pxBorders === true) {
        pxBorders = false;
    } else {
        pxBorders = true;
    }
})

// Paint the pixels based on brush size.
function paintPixels(pxIndex) {

    if (brushSize === "bucket") {
        paintBucket(pxIndex);
    }

    if (brushSize === "large") {
        paintLargeBrush(pxIndex);
    }

    if (brushSize === "small") {
        paintSmallBrush(pxIndex);
    }
}

// Paints a single pixel if it exists. Update the color beforehand based on the
// current mode and shading toggle value.
function paintSmallBrush(pxIndex) {

    if (pxIndex >= 0 &&
        pxIndex <= hValue * vValue) {

        updateColor(pxIndex);

        pixels[pxIndex].style.backgroundColor = currentColor;
    }
}

function updateColor(pxIndex) {

    if (currentMode === "standard") {
        currentColor = getRgbaFromHex(picker.value);

    } else if (currentMode === "random") {
        currentColor = `rgb(${getRandomRgbValue()}, ${getRandomRgbValue()}, 
        ${getRandomRgbValue()})`;
        
    } else if (currentMode === "erase") {
        currentColor = "rgba(255, 255, 255, 0)";
    }

    if (slider.value !== "0") {
        shadeColor(pixels[pxIndex]);
    }
}

// Get a random number to feed into currentColor in random mode.
function getRandomRgbValue() {
    return Math.floor(Math.random() * 255) + 1;
}

// Converts hex to rgba - REFACTORED
function getRgbaFromHex(hexString) {
    const hexArray = [hexString.slice(-6, -4), hexString.slice(-4, -2), hexString.slice(-2)];

    const rgbaArray = [
        parseInt(hexArray[0], 16),
        parseInt(hexArray[1], 16),
        parseInt(hexArray[2], 16),
        1
    ];

    rgbaString = `rgba(${rgbaArray.join(", ")})`;
    return rgbaString;
}

// Transform rgb colors to rgb. This ensures all modes properly recognize
// a pixel's color and compare it to the current color or other pixel colors.
function getRgbaFromRgb(rgbString) {
    // If the pixel hasn't been colored yet, its backgroundColor will return 
    // empty. In that case, we assume fully transparent white in order to work
    // well with all modes.
    if (!rgbString) {
        rgbString = "rgba(255, 255, 255, 0)";
    }

    const rgbArray = rgbString.split(", ");
    rgbaArray = rgbArray;
    if (!rgbaArray[3]) {
        rgbaArray[2] = rgbaArray[2].slice(0, -1);
        rgbaArray[3] = "1)";
    }
    rgbaArray[0] = rgbaArray[0].replace("rgb(", "rgba(");
    rgbaString = rgbaArray.join(", ");
    return rgbaString;
}

// Increase or decrease current color's alpha value by 0.1 based on the painted
// pixel's current alpha value.
function shadeColor(pixel) {
    currentColor = getRgbaFromHex(picker.value);

    const pxColorString = getRgbaFromRgb(pixel.style.backgroundColor);
    let pxColorArray = pxColorString.split(", ");
    let alphaValue = Number(pxColorArray[3].slice(0, -1));

    if (slider.value === "-1" && alphaValue < 1) {
        alphaValue += 0.1;
        pxColorArray[3] = alphaValue + ")";
    } else if (slider.value === "1" && alphaValue > 0) {
        alphaValue -= 0.1;
        pxColorArray[3] = alphaValue + ")";
    }

    // If the pixel is fully transparent, assume white in order to work well 
    // with the bucket's color recognition logic.
    if (!alphaValue) {
        currentColor = "rgba(255, 255, 255, 0)";
    } else {
        const currentColorArray = currentColor.split(", ");
        currentColorArray[3] = pxColorArray[3];
        currentColor = currentColorArray.join(", ");
    }
}

// Paint around the selected pixel while respecting edges and corners.
function paintLargeBrush(pxIndex) {

    paintSmallBrush(pxIndex);

    // Paint pixels on top and bottom if they don't go over the edge
    // (top and bottom edge logic inside paintSmallBrush).
    paintSmallBrush(pxIndex - hValue);
    paintSmallBrush(pxIndex + hValue);

    // Paint pixels on the sides if they don't go over the edge.
    if (pxIndex !== 0 &&
        pxIndex % hValue > (pxIndex - 1) % hValue) {
        paintSmallBrush(pxIndex - 1 - hValue);
        paintSmallBrush(pxIndex - 1);
        paintSmallBrush(pxIndex - 1 + hValue);
    }
    if (pxIndex % hValue < (pxIndex + 1) % hValue) {
        paintSmallBrush(pxIndex + 1 - hValue);
        paintSmallBrush(pxIndex + 1);
        paintSmallBrush(pxIndex + 1 + hValue);
    }
}

// Color pixels around the target pixel as long as they have the same color.
// Coloring stops when it encounters grid edge or a different colored pixel.
function paintBucket(pxIndex) {
    const bucketTargetColor = getRgbaFromRgb(pixels[pxIndex].style.backgroundColor);
    paintToEdge(pxIndex, bucketTargetColor);

    // Update the hover border after bucket painting without the mouse leaving 
    // the pixel.
    removeOutline();
    outlineBucket(pxIndex);
}

function paintToEdge(pxIndex, bucketTargetColor) {

    const adjacentPxColor = getRgbaFromRgb(pixels[pxIndex].style.backgroundColor);

    // Attempt to paint adjacent pixels as long as the color matches with
    // the target pixel.
    if (adjacentPxColor === bucketTargetColor) {
        
        paintSmallBrush(pxIndex);

        // Paint adjacent pixels until it encounters a pixel of the same color.
        if (bucketTargetColor !== currentColor) {

            // Paint pixels on the sides if they don't go over the edge.
            if (pxIndex !== 0 && 
                pxIndex % hValue > (pxIndex - 1) % hValue) {
                paintToEdge(pxIndex - 1, bucketTargetColor);
            }
        
            if (pxIndex % hValue < (pxIndex + 1) % hValue) {
                paintToEdge(pxIndex + 1, bucketTargetColor);
            }
        
            // Paint pixels on top and bottom if they don't go over the edge.
            if (pxIndex - hValue > 0) {
                paintToEdge(pxIndex - hValue, bucketTargetColor);
            }
        
            if (pxIndex + hValue < hValue * vValue) {
                paintToEdge(pxIndex + hValue, bucketTargetColor);
            }
        }
    }
}