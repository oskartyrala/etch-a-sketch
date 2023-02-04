const grid = document.querySelector(".grid");
const inputs = document.querySelectorAll(".top > input");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");
const wipe = document.querySelector(".wipe");
const picker = document.querySelector(".picker");
const pickerContainer = document.querySelector(".picker-container");

// Determines the current "brush" color
let currentColor = "#000000";

// Updates the current "brush" color
picker.addEventListener("input", () => {
    pickerContainer.style.backgroundColor = picker.value;
    currentColor = picker.value;
})

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

        // Changes the background color of a pixel
        function colorPixel(e) {
            if (e.buttons === 1) {
                e.preventDefault();
                pixel.style.backgroundColor = currentColor;
            }
        }

        grid.appendChild(pixel);
    }
}

// Wipes the board
wipe.addEventListener("click", () => {
    createGrid(horizontal, vertical);
})