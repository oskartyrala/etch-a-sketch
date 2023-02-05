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

// Determines the current mode and "brush" color
let currentColor;
pickColor();
markSelected();

// Changes mode to standard and updates the current "brush" color
picker.addEventListener("input", pickColor);

picker.addEventListener("click", pickColor);

function pickColor() {
    pickerContainer.style.backgroundColor = picker.value;
    currentMode = "pick";
    currentColor = picker.value;
    markSelected();
}

// Changes mode to erase and changes the color to white;
erase.addEventListener("click", () => {
    currentMode = "erase";
    currentColor = "#ffffff";
    markSelected();
})

// Changes mode to rainbow
rainbow.addEventListener("click", () => {
    currentMode = "rainbow";
    markSelected();
})

function markSelected() {
    for (mode of modes) {
        mode.classList.remove("selected");
    }
    document.getElementById(`${currentMode}`).classList.add("selected");
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
        pixel.classList.add("white");
        pixel.style.height = (600 / vValue) + "px";
        pixel.style.width = (600 / hValue) + "px";

        pixel.addEventListener("mousedown", (e) => {
            colorPixel(e);
        })

        pixel.addEventListener("mouseenter", (e) => {
            colorPixel(e);
        })

        // Changes the background color of a pixel. If current mode is rainbow,
        // randomize the color first.
        function colorPixel(e) {

            if (currentMode === "rainbow") {
                currentColor = `rgb(${getRGBValue()}, ${getRGBValue()}, 
                ${getRGBValue()})`;
            }

            if (e.buttons === 1) {
                e.preventDefault();
                pixel.style.backgroundColor = currentColor;
            }
        }

        grid.appendChild(pixel);
    }
}

// Gets a random number to feed into random color in rainbow mode
function getRGBValue() {
    return Math.floor(Math.random() * 255) + 1;
}

// Wipes the board
wipe.addEventListener("click", () => {
    createGrid(horizontal, vertical);
})