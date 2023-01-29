const grid = document.querySelector(".grid");
const inputs = document.querySelectorAll("input");
const horizontal = document.querySelector(".horizontal");
const vertical = document.querySelector(".vertical");

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

    for (let i = 0; i < (hValue * vValue); i++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixel");
        pixel.classList.add("white");
        pixel.style.height = (100 / vValue) + "%";
        pixel.style.width = (100 / hValue) + "%";
        grid.appendChild(pixel);
    }
}