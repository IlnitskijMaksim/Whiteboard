const ROOM_ID = "room_3533";
const API = "http://localhost:8000";

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
let drawing = false;

const FILTERS = ["blur", "invert"];
const select = document.getElementById("filter-select");
FILTERS.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    select.appendChild(opt);
});

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', e => {
  if(!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const cmd = { x: e.clientX - rect.left, y: e.clientY - rect.top, type: "line" };
  sendCommand(cmd);
  draw(cmd);
});

document.getElementById("apply-filter")
        .addEventListener("click", applyFilter);

async function applyFilter() {
  const { width, height } = canvas;
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  const imgData = ctx.getImageData(0, 0, width, height);
  const dataArray = Array.from(imgData.data);

  const filterName = select.value;
  
  console.log("Sending data:", {
    width,
    height,
    filterName,
    dataLength: dataArray.length
  });

  try {
    const res = await fetch(`http://localhost:8000/filter/${ROOM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_data: dataArray,
        filter_name: filterName,
        width,
        height
      })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const json = await res.json();
    console.log("Received data length:", json.image_data.length);

    const newData = new Uint8ClampedArray(json.image_data);
    ctx.putImageData(new ImageData(newData, width, height), 0, 0);
  } catch (error) {
    console.error("Error applying filter:", error);
  }
}


document.getElementById('refresh').onclick = poll;

function draw(cmd){
  ctx.lineTo(cmd.x, cmd.y);
  ctx.stroke();
}

async function sendCommand(cmd){
  await fetch(`${API}/draw/${ROOM_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
}

async function poll(){
  const res = await fetch(`${API}/draw/${ROOM_ID}`);
  const cmds = await res.json();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.beginPath();
  cmds.forEach(draw);
}

poll();