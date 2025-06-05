const ROOM_ID = "room_3533";
const API = "http://localhost:8000";

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
let drawing = false;
let color = "#000000"; // Колір кисті за замовчуванням
let brushSize = 5; // Розмір кисті за замовчуванням

// Фільтри
const FILTERS = ["blur", "invert"];
const filterSelect = document.getElementById("filter-select");
FILTERS.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    filterSelect.appendChild(opt);
});

// Контроль кольору
const colorPicker = document.getElementById("color-picker");
colorPicker.addEventListener('input', (e) => {
    color = e.target.value;
    ctx.strokeStyle = color;
});

// Контроль розміру кисті
const brushSizeInput = document.getElementById("brush-size");
brushSizeInput.addEventListener('input', (e) => {
    brushSize = e.target.value;
    ctx.lineWidth = brushSize;
});

// Початок малювання
canvas.addEventListener('mousedown', () => (drawing = true));
canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.beginPath();
});
canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const cmd = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        type: "line",
        color, // Колір малювання
        size: brushSize, // Розмір кисті
    };
    sendCommand(cmd); // Відправляємо команду на сервер
    draw(cmd); // Малюємо локально
});

// Малюємо лінію на canvas
function draw(cmd) {
    ctx.strokeStyle = cmd.color || "#000000"; // Стиль лінії
    ctx.lineWidth = cmd.size || 5; // Розмір кисті
    ctx.lineTo(cmd.x, cmd.y); // Лінія до нового положення
    ctx.stroke(); // Малювання
}

// Застосування фільтру
async function applyFilter() {
    const { width, height } = canvas;

    // Зберігаємо поточний стан
    ctx.save();

    // Заповнюємо фон білим кольором (щоб прозорі ділянки також інвертувалися)
    ctx.globalCompositeOperation = "destination-over"; // Малюємо під усім
    ctx.fillStyle = "#ffffff"; // Білий фон
    ctx.fillRect(0, 0, width, height); // Заповнюємо весь canvas

    // Отримуємо пікселі з canvas
    const imgData = ctx.getImageData(0, 0, width, height);
    const dataArray = Array.from(imgData.data);

    // Відновлюємо попередній стан
    ctx.restore();

    const filterName = filterSelect.value;

    try {
        const res = await fetch(`${API}/filter/${ROOM_ID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image_data: dataArray,
                filter_name: filterName,
                width,
                height,
            }),
        });

        if (!res.ok) {
            throw new Error(`Error applying filter: ${res.status}`);
        }

        const json = await res.json();
        const newData = new Uint8ClampedArray(json.image_data);

        // Замінюємо пікселі на відфільтровані
        ctx.putImageData(new ImageData(newData, width, height), 0, 0);
    } catch (error) {
        console.error("Error applying filter:", error);
    }
}

// Відправка команд на сервер
async function sendCommand(cmd) {
    await fetch(`${API}/draw/${ROOM_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
    });
}

// Очищаємо canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка всього полотна
}

// Кнопка очищення полотна
document.getElementById("clear-draw").addEventListener("click", async () => {
    const confirmation = confirm("Очистити малюнок?");
    if (!confirmation) return;

    const response = await fetch(`${API}/draw/${ROOM_ID}`, {
        method: "DELETE",
    });

    if (response.ok) {
        alert("Малюнок очищено!");
        clearCanvas();
    } else {
        const errorData = await response.json();
        alert(`Сталася помилка: ${errorData.detail}`);
    }
});

// Завантаження команд із сервера
async function poll() {
    const res = await fetch(`${API}/draw/${ROOM_ID}`);
    const cmds = await res.json();
    clearCanvas(); // Очищуємо перед малюванням
    ctx.beginPath(); // Починаємо нові шляхи
    cmds.forEach(draw);
}

// Виклик функції для фільтрування
document.getElementById("apply-filter").addEventListener("click", applyFilter);

// Завантаження малюнку при старті
poll();