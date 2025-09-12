var canv_width = 400;
var canv_height = 400;
var num_cols = 30;
var num_rows = 30;
var cell_width = canv_width / num_cols;
var cell_height = canv_height / num_rows;
var Cell_Type;
(function (Cell_Type) {
    Cell_Type[Cell_Type["Snake"] = 0] = "Snake";
    Cell_Type[Cell_Type["Food"] = 1] = "Food";
    Cell_Type[Cell_Type["Empty"] = 2] = "Empty";
})(Cell_Type || (Cell_Type = {}));
;
var snake_pos = { x: 0, y: 0 };
var snake_bodys = [];
var snake_length = 1;
var snake_dir = { x: 0, y: 0 };
var canvas = document.createElement('canvas');
canvas.width = canv_width;
canvas.height = canv_height;
var ctx = canvas.getContext("2d");
var game_grid = initGameGrid();
var last_time = 0;
var move_counter = 0;
if (!ctx) {
    throw new Error("Failed to load context");
}
ctx.fillRect(0, 0, canv_width, canv_height);
drawGrid(ctx);
dropFood();
initSnake();
drawState(ctx);
requestAnimationFrame(gameUpdate);
function initGameGrid() {
    var game_grid = new Array;
    for (var x = 0; x < num_cols; x++) {
        var row = new Array;
        for (var y = 0; y < num_rows; y++) {
            row.push(Cell_Type.Empty);
        }
        game_grid.push(row);
    }
    return game_grid;
}
function drawState(ctx) {
    ctx.clearRect(0, 0, canv_width, canv_height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canv_width, canv_height);
    for (var x = 0; x < num_cols; x++) {
        for (var y = 0; y < num_rows; y++) {
            switch (game_grid[x][y]) {
                case Cell_Type.Food:
                    ctx.fillStyle = 'green';
                    ctx.fillRect(x * cell_width, y * cell_width, cell_width, cell_height);
                    break;
                case Cell_Type.Snake:
                    ctx.fillStyle = 'red';
                    ctx.fillRect(x * cell_width, y * cell_width, cell_width, cell_height);
                    break;
            }
        }
    }
}
function dropFood() {
    var randx = Math.floor(Math.random() * num_cols);
    var randy = Math.floor(Math.random() * num_rows);
    console.log("Dropped food at ".concat(randx, ", ").concat(randy));
    game_grid[randx][randy] = Cell_Type.Food;
}
function initSnake() {
    var randx = Math.floor(Math.random() * num_cols);
    var randy = Math.floor(Math.random() * num_rows);
    game_grid[randx][randy] = Cell_Type.Snake;
    snake_pos.x = randx;
    snake_pos.y = randy;
    console.log("Placed snake at ".concat(randx, ", ").concat(randy));
    if (Math.random() < 0.5) {
        snake_dir.x = [-1, 1][Math.floor(Math.random() * 2)];
        snake_dir.y = 0;
    }
    else {
        snake_dir.x = 0;
        snake_dir.y = [-1, 1][Math.floor(Math.random() * 2)];
    }
    console.log("Initialized direction with ".concat(snake_dir.x, ", ").concat(snake_dir.y));
}
function gameUpdate(current_time) {
    var delta = current_time - last_time;
    last_time = current_time;
    move_counter += delta;
    if (move_counter > 75) {
        updateSnake();
        move_counter = 0;
    }
    drawState(ctx);
    requestAnimationFrame(gameUpdate);
}
function updateSnake() {
    game_grid[snake_pos.x][snake_pos.y] = Cell_Type.Snake;
    snake_bodys.push({ x: snake_pos.x, y: snake_pos.y });
    snake_pos.x += snake_dir.x;
    snake_pos.y += snake_dir.y;
    if (snake_pos.x >= num_cols) {
        snake_pos.x = 0;
    }
    else if (snake_pos.x < 0) {
        snake_pos.x = num_cols - 1;
    }
    if (snake_pos.y >= num_rows) {
        snake_pos.y = 0;
    }
    else if (snake_pos.y < 0) {
        snake_pos.y = num_rows - 1;
    }
    if (game_grid[snake_pos.x][snake_pos.y] === Cell_Type.Food) {
        snake_length += 1;
        dropFood();
    }
    if (snake_bodys.length > snake_length) {
        var tail = snake_bodys.shift();
        game_grid[tail.x][tail.y] = Cell_Type.Empty;
    }
    game_grid[snake_pos.x][snake_pos.y] = Cell_Type.Snake;
}
function drawGrid(ctx) {
    ctx.lineWidth = 1;
    for (var x = 0; x < num_cols * cell_width; x += cell_width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canv_height);
        ctx.closePath();
        ctx.stroke();
    }
    for (var y = 0; y < num_rows * cell_height; y += cell_height) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canv_width, y);
        ctx.closePath();
        ctx.stroke();
    }
}
export function get_canvas() {
    return canvas;
}
window.addEventListener('keydown', handle_input);
function handle_input(e) {
    switch (e.code) {
        case "ArrowLeft":
            if (snake_dir.x === 0) {
                snake_dir = { x: -1, y: 0 };
            }
            break;
        case "ArrowUp":
            if (snake_dir.y === 0)
                snake_dir = { x: 0, y: -1 };
            break;
        case "ArrowRight":
            snake_dir = { x: 1, y: 0 };
            break;
        case "ArrowDown":
            snake_dir = { x: 0, y: 1 };
            break;
    }
}
//# sourceMappingURL=snake.js.map