const grid = document.querySelector(".grid");
const inputs = document.querySelectorAll("input");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");
const wipe = document.querySelector(".wipe");
const colors = document.querySelectorAll(".color");

// Determines the current "brush" color
let currentColor = "black";

for (color of colors) {
    color.addEventListener("click", (e) => {
        currentColor = e.target.classList[1];
    })
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

        // Changes the background color of a pixel
        function colorPixel(e) {
            if (e.buttons === 1) {
                e.preventDefault();
                pixel.classList.remove("white", "gray", "black", "purple", "indigo", "blue", "green", "yellow", "orange", "red");
                pixel.classList.add(`${currentColor}`);
            }
        }

        grid.appendChild(pixel);
    }
}

// Wipes the board
wipe.addEventListener("click", () => {
    createGrid(horizontal, vertical);
})