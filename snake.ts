const canv_width = 400;
const canv_height = 400;

const num_cols = 20;
const num_rows: number = 20;

const cell_width = canv_width / num_cols;
const cell_height = canv_height / num_rows;

enum Cell_Type { Snake, Food, Empty };

var snake_pos: Vector2 = { x: 0, y: 0 };
var snake_bodys: Array<Vector2> = [];
var snake_length = 1;
var snake_dir: Vector2 = { x: 0, y: 0 }

const canvas = document.createElement('canvas');
canvas.width = canv_width;
canvas.height = canv_height;
var ctx = canvas.getContext("2d");

const game_grid = initGameGrid();

var last_time = 0;
var move_counter = 0;
var delta = 0;


if (!ctx) {
        throw new Error("Failed to load context");
}

ctx.fillRect(0, 0, canv_width, canv_height);
drawGrid(ctx);

dropFood();
initSnake();
render(ctx);

requestAnimationFrame(gameUpdate);

function initGameGrid() {
        var game_grid = new Array<Array<Cell_Type>>;
        for (let x = 0; x < num_cols; x++) {
                let row = new Array<Cell_Type>;
                for (let y = 0; y < num_rows; y++) {
                        row.push(Cell_Type.Empty);
                }
                game_grid.push(row);
        }
        return game_grid;
}

function render(ctx: CanvasRenderingContext2D) {

        ctx.clearRect(0, 0, canv_width, canv_height);

        ctx.strokeStyle = 'white';
        ctx.strokeText(`Delta : ${delta} \nScore : ${snake_length}`, 5, 20, canv_width);

        for (let x = 0; x < num_cols; x++) {
                for (let y = 0; y < num_rows; y++) {
                        switch (game_grid[x][y]) {
                                case Cell_Type.Food:
                                        ctx.beginPath();
                                        ctx.strokeStyle = 'white';
                                        ctx.lineWidth = 2;
                                        ctx.roundRect(x * cell_width, y * cell_width, cell_width, cell_height, 5);
                                        ctx.stroke();
                                        break;
                                case Cell_Type.Snake:
                                        ctx.beginPath();
                                        ctx.strokeStyle = 'red';
                                        ctx.lineWidth = 2;
                                        ctx.roundRect(x * cell_width, y * cell_width, cell_width, cell_height, 5);
                                        ctx.stroke();
                                        break;

                        }
                }
        }
}
function dropFood() {
        var randx: number
        var randy: number;
        do {
                randx = Math.floor(Math.random() * num_cols);
                randy = Math.floor(Math.random() * num_rows);
        } while (game_grid[randx][randy] !== Cell_Type.Empty);

        console.log(`Dropped food at ${randx}, ${randy}`)
        game_grid[randx][randy] = Cell_Type.Food;
}

function initSnake() {
        var randx = Math.floor(Math.random() * num_cols);
        var randy = Math.floor(Math.random() * num_rows);
        game_grid[randx][randy] = Cell_Type.Snake;
        snake_pos.x = randx;
        snake_pos.y = randy;
        console.log(`Placed snake at ${randx}, ${randy}`)


        if (Math.random() < 0.5) {
                snake_dir.x = [-1, 1][Math.floor(Math.random() * 2)];
                snake_dir.y = 0;
        } else {
                snake_dir.x = 0;
                snake_dir.y = [-1, 1][Math.floor(Math.random() * 2)];
        }
        console.log(`Initialized direction with ${snake_dir.x}, ${snake_dir.y}`)
}

function gameUpdate(current_time: number) {
        delta = current_time - last_time;
        last_time = current_time;
        move_counter += delta;

        if (move_counter > 75) {
                updateSnake();
                move_counter = 0;
        }

        render(ctx);
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
                //HANDLE FOOD STUFF HERE
                snake_length += 1;
                dropFood()
        }

        if (snake_bodys.length > snake_length) {
                var tail = snake_bodys.shift();
                game_grid[tail.x][tail.y] = Cell_Type.Empty;
        }
        game_grid[snake_pos.x][snake_pos.y] = Cell_Type.Snake;
}
function drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 1;
        for (let x = 0; x < num_cols * cell_width; x += cell_width) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canv_height);
                ctx.closePath();
                ctx.stroke();
        }

        for (let y = 0; y < num_rows * cell_height; y += cell_height) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canv_width, y);
                ctx.closePath();
                ctx.stroke();
        }
}

export function get_canvas(): HTMLCanvasElement {
        return canvas;
}

type Vector2 = {
        x: number;
        y: number;
}

window.addEventListener('keydown', handle_input);


function handle_input(e: KeyboardEvent) {
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
                        if (snake_dir.x === 0) {
                                snake_dir = { x: 1, y: 0 };
                        }
                        break;
                case "ArrowDown":
                        if (snake_dir.y === 0) {
                                snake_dir = { x: 0, y: 1 };
                        }
                        break;

        }
}

