const grid = document.querySelector(".grid");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");
const wipe = document.querySelector(".wipe");
const modes = document.querySelectorAll(".mode");
const pickerContainer = document.querySelector("#standard");
const picker = document.querySelector(".picker");
const slider = document.querySelector(".slider");
const lighten = document.querySelector(".lighten");
const darken = document.querySelector(".darken")
const brushes = document.querySelectorAll("button.brush");
const borderless = document.querySelector(".borderless");
const undo = document.querySelector(".undo");
const redo = document.querySelector(".redo");
const lock = document.querySelector(".lock");

let pixels = [];
let currentMode;
let currentColor;
let shadeKeeper;
let brushSize = "small";
let pxBorders = true;
let allStateStorage = [];
let previousState = [];
let undoTracker = 0;
let locked = false;

// Set up the initial state
setMode("standard");
pickColor();
createGrid(horizontal, vertical);

// Clicking the lock will update both dimension values when one is changed.
lock.addEventListener("click", () => {
    locked = !locked;
    lock.classList.toggle("active");
})

// Create grid based on user input. Limit grid size to between 1x1 and 100x100.
// Add listeners to pixels to enable painting.
horizontal.addEventListener("change", (e) => createGrid(horizontal, vertical, e.target));
vertical.addEventListener("change", (e) => createGrid(horizontal, vertical, e.target));

function createGrid(horizontal, vertical, changedDimension) {
    pixels = [];
    grid.textContent = "";
    undoTracker = 0;
    allStateStorage = []
    toggleUndo();
    toggleRedo();

    // If input fields are locked, update both to the value of the changed one.
    if (locked) {
        horizontal.value = changedDimension.value;
        vertical.value = changedDimension.value;
    }

    // Limit input to integers between 1 and 100
    horizontal.value = Math.round(horizontal.value);
    vertical.value = Math.round(vertical.value);

    if (Number(horizontal.value) < 1) {
        horizontal.value = 1;
    } else if ((Number(horizontal.value)) > 100) {
        horizontal.value = 100;
    }

    if (Number(vertical.value) < 1) {
        vertical.value = 1;
    } else if (Number(vertical.value) > 100) {
        vertical.value = 100;
    }

    hValue = Number(horizontal.value);
    vValue = Number(vertical.value);

    // Create the pixels in the grid.
    for (let i = 0; i < (hValue * vValue); i++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixel");
        if (!pxBorders) {
            pixel.classList.add("noborders");
        }
        
        pixel.style.width = (100 / hValue) + "%";
        pixel.style.height = (600 / vValue) + "px";

        pixel.addEventListener("mousedown", (e) => {

            const pxIndex = pixels.indexOf(e.target);

            if (e.buttons === 1) {
                e.preventDefault();

                // On painting while redo is possible, remove all redoable states.
                if (undoTracker !== 0) {
                    for (let i = 0; i < undoTracker; i++) {
                        allStateStorage.shift();
                    }
                    undoTracker = 0;
                }

                // Marking pixels allows undo and redo to work with shading and random.
                for (pixle of pixels) {
                    pixle.classList.remove("tracked");
                }

                previousState = [];
                paintPixels(pxIndex);
                storeAllStates();

                toggleUndo();
                toggleRedo();
            }
        })

        pixel.addEventListener("mouseenter", (e) => {

            const pxIndex = pixels.indexOf(e.target);

            switch (brushSize) {
                case "small":
                    addBorder(pxIndex, "top");
                    addBorder(pxIndex, "bottom");
                    addBorder(pxIndex, "left");
                    addBorder(pxIndex, "right");
                    break;

                case "large":
                    outlineLargeBrush(pxIndex);
                    break;

                case "bucket":
                    outlineBucket(pxIndex);
                    break;
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

// Store up to 50 previous states to enable undo and redo.
function storePreviousState(pxIndex, pxPrevColor, pxNewColor) {

    // Store the previous state of each pixel only once to avoid overwriting
    // the previous color. This allows undo and redo to work properly with
    // shading and random, which can paint a single pixel several times in a 
    // single brushstroke.
    if (!(pixels[pxIndex].classList.contains("tracked"))) {
        pixels[pxIndex].classList.add("tracked");

        let pixelObject = {index: pxIndex, previousColor: pxPrevColor, newColor: pxNewColor};
        previousState.push(pixelObject);
    }

}

function storeAllStates() {
    allStateStorage.unshift(previousState);
    if (allStateStorage.length > 50) {
        allStateStorage.pop();
    }
}

// Undo logic - restore previous color of pixels painted in the last brushstroke.
undo.addEventListener("click", () => {
    undoLast();
})

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z" && !undo.disabled) {
        // preventDefault is needed so that it doesn't interact with the
        // input fields.
        e.preventDefault();
        undoLast();
    }
})

function undoLast() {
    if (undoTracker < 50) {
        for (object of allStateStorage[undoTracker]) {
            pixels[object.index].style.backgroundColor = object.previousColor;
        }
        undoTracker++;
    }

    toggleUndo();
    toggleRedo();
}

// Redo logic - restore the new pixel color of previously undone actions.
redo.addEventListener("click", () => {
    redoLast();
})

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "y" && !redo.disabled) {
        // preventDefault is needed so that it doesn't interact with the
        // input fields.
        e.preventDefault();
        redoLast();
    }
})

function redoLast() {

    if (undoTracker > 0) {
        for (object of allStateStorage[undoTracker - 1]) {
            pixels[object.index].style.backgroundColor = object.newColor;
        }
        undoTracker--;
    }

    toggleUndo();
    toggleRedo();
}

function toggleUndo() {
    if (undoTracker === allStateStorage.length) {
        undo.disabled = true;
    } else {
        undo.disabled = false;
    }
}

function toggleRedo() {
    if (undoTracker === 0) {
        redo.disabled = true;
    } else {
        redo.disabled = false;
    }
}

// Add borders around the area that will be painted.
// This function accepts one side argument instead of multiple to make it easier
// to generate random colors for each border in random mode.
// The function being called separately for each side means the border color
// will get randomly generated anew each time.
function addBorder(pxIndex, side) {

    let borderColor;

    switch (currentMode) {
        case "standard":
            borderColor = getRgbaFromHex(picker.value);
            break;

        case "erase":
            borderColor = "rgba(255, 255, 255, 1)";
            break;

        case "random":
            borderColor = `rgba(${getRandomRgbValue()}, ${getRandomRgbValue()}, 
            ${getRandomRgbValue()}, 1)`;
            break;
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
wipe.addEventListener("click", () => createGrid(horizontal, vertical, horizontal));

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

// Update the slider either on slider input or button click. If active button
// is clicked, turn off shading.

lighten.addEventListener("click", () => {
    if (slider.value !== "1") {
        slider.value = "1";
    } else {
        slider.value = "0"
    }
    updateSlider();
})

darken.addEventListener("click", () => {
    if (slider.value !== "-1") {
        slider.value = "-1";
    } else {
        slider.value = "0"
    }
    updateSlider();
})

slider.addEventListener("input", () => {
    updateSlider();
})

function updateSlider() {

    lighten.classList.remove("active");
    darken.classList.remove("active");

    switch (slider.value) {
        case "1":
            lighten.classList.add("active");
            break;

        case "-1":
            darken.classList.add("active");
            break;
    }
}

// In erase mode, lock the shading toggle. It doesn't make sense to combine 
// erase with shading. When back in standard mode, set toggle to the 
// previously selected value.

function toggleShade() {
    if (currentMode === "erase") {
        shadeKeeper = slider.value;
        slider.value = "0";
        slider.disabled = true;
        darken.disabled = true;
        lighten.disabled = true;
        slider.style.pointerEvents = "none";
    } else {
        slider.style.pointerEvents = "";
        slider.disabled = false;
        darken.disabled = false;
        lighten.disabled = false;
        slider.value = shadeKeeper;
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

    switch (brushSize) {
        case "small":
            paintSmallBrush(pxIndex);
            break;

        case "large":
            paintLargeBrush(pxIndex);
            break;

        case "bucket":
            paintBucket(pxIndex);
            break;
    }
}

// Paints a single pixel if it exists. Update the color beforehand based on the
// current mode and shading toggle value.
function paintSmallBrush(pxIndex) {

    if (pxIndex >= 0 &&
        pxIndex <= hValue * vValue) {

        updateColor(pxIndex);

        // Paint only if the currentColor is different than the pixel's color.
        // This ensures the undo button works properly and also undoes
        // the pixels that were painted over twice or more with the same stroke.
        if (getRgbaFromRgb(pixels[pxIndex].style.backgroundColor) !== currentColor) {
            const pxPrevColor = getRgbaFromRgb(pixels[pxIndex].style.backgroundColor);

            pixels[pxIndex].style.backgroundColor = currentColor;
            
            const pxNewColor = getRgbaFromRgb(pixels[pxIndex].style.backgroundColor);
            storePreviousState(pxIndex, pxPrevColor, pxNewColor);
        }
    }
}

function updateColor(pxIndex) {

    switch (currentMode) {
        case "standard":
            currentColor = getRgbaFromHex(picker.value);
            break;

        case "random":
            currentColor = `rgba(${getRandomRgbValue()}, 
            ${getRandomRgbValue()}, ${getRandomRgbValue()}, 1)`;
            break;

        case "erase":
            currentColor = "rgba(255, 255, 255, 0)";
            break;
    }

    // Checking if pxIndex has been passed is necessary to make sure this 
    // function can be called by pickColor() and setMode() when in shaidng mode.
    if (slider.value !== "0" && arguments.length > 0) {
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

    switch (currentMode) {
        case "standard":
            currentColor = getRgbaFromHex(picker.value);
            break;

        case "random":
            currentColor = `rgba(${getRandomRgbValue()}, 
            ${getRandomRgbValue()}, ${getRandomRgbValue()}, 1)`;
            break;
    }


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