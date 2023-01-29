const grid = document.querySelector(".grid");
const inputs = document.querySelectorAll("input");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");
const wipe = document.querySelector(".wipe");

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
        pixel.style.height = (100 / vValue) + "%";
        pixel.style.width = (100 / hValue) + "%";

        pixel.addEventListener("mouseenter", () => {
            pixel.classList.add("black");
        })

        grid.appendChild(pixel);
    }
}

wipe.addEventListener("click", () => {
    createGrid(horizontal, vertical);
})