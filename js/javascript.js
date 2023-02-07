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

// Determines the current mode and "brush" color
let currentColor;
let shadeKeeper;
pickColor();
markSelected();

// Changes mode to standard and updates the current "brush" color
picker.addEventListener("input", pickColor);
picker.addEventListener("click", pickColor);

function pickColor() {
    currentMode = "pick";
    pickerContainer.style.backgroundColor = picker.value;
    currentColor = convertToRgb(picker.value);
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
        pixel.style.height = (600 / vValue) + "px";
        pixel.style.width = (600 / hValue) + "px";

        pixel.addEventListener("mousedown", (e) => {
            colorPixel(e, pixel);
        })

        pixel.addEventListener("mouseenter", (e) => {
            colorPixel(e, pixel);
        })
        
        grid.appendChild(pixel);
    }
}

// Changes the background color of a pixel depending on mode
function colorPixel(e, pixel) {

    if (e.buttons === 1) {
        e.preventDefault();

        // Rainbow mode color generator
        if (currentMode === "rainbow") {
            currentColor = `rgb(${getRGBValue()}, ${getRGBValue()}, 
            ${getRGBValue()})`;
        }

        // Erase mode
        if (currentMode === "erase") {
            currentColor = "rgba(0, 0, 0, 0)";
        }

        // Shade mode logic
        if (shade.value !== "0") {
           shadeColor(pixel);
        } else {
            pixel.style.backgroundColor = currentColor;
        }

    }
}

// Gets a random number to feed into random color in rainbow mode
function getRGBValue() {
    return Math.floor(Math.random() * 255) + 1;
}

// Increases or decreases current color's alpha by 0.1
function shadeColor(pixel) {

    // If the pixel hasn't been colored yet, we assume fully transparent white
    if (!pixel.style.backgroundColor) {
        pixel.style.backgroundColor = "rgba(255, 255, 255, 0)";
    };

    // Takes out the current alpha value of the pixel. If there is no alpha 
    // value, it means it's 1 (fully opaque).
    const pixelColorArray = pixel.style.backgroundColor.split(", ");
    if (!pixelColorArray[3]) {
        pixelColorArray[3] = "1)";
    };
    alphaValue = Number(pixelColorArray[3].slice(0, -1));

    // Depending on the shade toggle, adjusts the alpha value
    if (shade.value === "-1" && alphaValue < 1) {
        alphaValue += 0.1;
        pixelColorArray[3] = alphaValue + ")";
    } else if (shade.value === "1" && alphaValue > 0) {
        alphaValue -= 0.1;
        pixelColorArray[3] = alphaValue + ")";
    }

    // Combines the new alpha value with the current color and paints the pixel
    const currentColorArray = currentColor.split(", ");
    currentColorArray[3] = pixelColorArray[3];
    shadedColor = currentColorArray.join(", ");
    pixel.style.backgroundColor = shadedColor;
}

// Wipes the board
wipe.addEventListener("click", () => {
    createGrid(horizontal, vertical);
})