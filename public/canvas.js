let canvas = document.querySelector("canvas");
canvas.width = window.innerWidth; //whole window
canvas.height = window.innerHeight;

let pencilColor = document.querySelectorAll(".pencil-color");
let pencilWidthElem = document.querySelector(".pencil-width");
let eraserWidthElem = document.querySelector(".eraser-width");
let download = document.querySelector(".download");
let redo = document.querySelector(".redo");
let undo = document.querySelector(".undo");

let penColor = "red";
let eraserColor = "white";
let penWidth = pencilWidthElem.value;
let eraserWidth = eraserWidthElem.value;

let undoRedoTracker = []; //Data
let track = 0; // Represent which action from tracker array

let mouseDown = false; //by defaulte false, otherwise whenever pointer comes on screen it will draw

// API to perform graphics
let tool = canvas.getContext("2d");

tool.strokeStyle = penColor;
tool.lineWidth = penWidth;

// mousedown -> start new path, mousemove -> path fill (graphics), mouseup -> mouse button now free (don't draw now)
canvas.addEventListener("mousedown", (e) => { //eventlistner on canvas
    mouseDown = true; //by default it was false above, now it will draw anything
    let data = {
        x: e.clientX, //horizontal distance where mouse is clicked
        y: e.clientY
    }
    socket.emit("beginPath", data); //data will go to server
})
canvas.addEventListener("mousemove", (e) => {
    if (mouseDown) {
        let data = {
            x: e.clientX,
            y: e.clientY,
            color: eraserFlag ? eraserColor : penColor, //eraser flag agar true h to  eraser color ajaga vrna pen color
            width: eraserFlag ? eraserWidth : penWidth 
        }
        socket.emit("drawStroke", data);
    }
})
canvas.addEventListener("mouseup", (e) => {
    mouseDown = false; //

    let url = canvas.toDataURL();
    undoRedoTracker.push(url); //jesi mouse ko release kra last graphic element  bnke array me save 
    track = undoRedoTracker.length-1;
})

undo.addEventListener("click", (e) => {
    if (track > 0) track--; // agar 0 se jyada h tabhi previous element p jana h , vrma minus 1 to in valid hoja agar 0th element par hue
    // track action
    let data = {
        trackValue: track,
        undoRedoTracker
    }
    socket.emit("redoUndo", data);
})
redo.addEventListener("click", (e) => {
    if (track < undoRedoTracker.length-1) track++; //second last elent per ho  jyada se jyada, tabhi valid h 
    // track action
    let data = {
        trackValue: track,
        undoRedoTracker
    }
    socket.emit("redoUndo", data);
})

function undoRedoCanvas(trackObj) { //is trackobj object me track ka data, or kon se data ka represent krna bo value
    track = trackObj.trackValue;
    undoRedoTracker = trackObj.undoRedoTracker;

    let url = undoRedoTracker[track];
    let img = new Image(); // new image reference element
    img.src = url;
    img.onload = (e) => { //jo previous action mene kra tha bo fir se draw kro
        tool.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
}

function beginPath(strokeObj) {
    tool.beginPath(); //generate new line
    tool.moveTo(strokeObj.x, strokeObj.y); //start point of that line 
}
function drawStroke(strokeObj) {
    tool.strokeStyle = strokeObj.color; 
    tool.lineWidth = strokeObj.width;
    tool.lineTo(strokeObj.x, strokeObj.y); //end point of that line
    tool.stroke(); //fill color in that line
}

pencilColor.forEach((colorElem) => {
    colorElem.addEventListener("click", (e) => { //jis color element pr bhi click ho turant call back function h event object k sath use call krdena
        let color = colorElem.classList[0]; //color list ki 0 index wali
        penColor = color;
        tool.strokeStyle = penColor; //now stroke strike is also changed to pen color (jo bhi choosed hoga)
    })
})

pencilWidthElem.addEventListener("change", (e) => { //when even pen width is changed, change color width also
    penWidth = pencilWidthElem.value;
    tool.lineWidth = penWidth; //put that width to tool width
})
eraserWidthElem.addEventListener("change", (e) => {
    eraserWidth = eraserWidthElem.value;
    tool.lineWidth = eraserWidth;
})
eraser.addEventListener("click", (e) => { //likha hua white colour se overwrite, or fir jesi eraser close ho pen wali property ajaye mouse me wapas
    if (eraserFlag) { //if flag is true 
        tool.strokeStyle = eraserColor;
        tool.lineWidth = eraserWidth;
    } else {
        tool.strokeStyle = penColor;
        tool.lineWidth = penWidth;
    }
})

download.addEventListener("click", (e) => {
    let url = canvas.toDataURL(); //canvas k upar pixels ki jo bhi graphics h uske sath ye url covert krdega

    let a = document.createElement("a");
    a.href = url; //ancher se download hojaga
    a.download = "board.jpg";
    a.click();
})


socket.on("beginPath", (data) => {
    // data -> data from server
    beginPath(data);
})
socket.on("drawStroke", (data) => {
    drawStroke(data);
})
socket.on("redoUndo", (data) => {
    undoRedoCanvas(data);
})