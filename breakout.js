import { addVec, reflectVec, normalizeVec, multVecI, getNormal, pointNearLine } from "./lib.js";
var canv_width = 400;
var canv_height = 400;
var canvas = document.createElement('canvas');
canvas.width = canv_width;
canvas.height = canv_height;
var ctx = canvas.getContext("2d");
var canvas_transform;
var last_time = 0;
var delta = 0;
var running = false;
var NUM_BLOCKS_X = 10;
var NUM_BLOCKS_Y = 10;
var BLOCK_PAD_X = 1.1;
var BLOCK_PAD_Y = 2;
var BLOCK_WIDTH = canv_width / (NUM_BLOCKS_X * BLOCK_PAD_X);
var BLOCK_HEIGHT = 7;
var input_stack = [];
var player;
var blocks = [];
var ball;
if (!ctx) {
    throw new Error("Failed to load context");
}
var Player = (function () {
    function Player() {
        this.pos = { x: canv_width / 2, y: canv_height - 50 };
        this.velocity = { x: 0, y: 0 };
        this.width = 30;
        this.points = [{ x: this.pos.x - this.width / 2, y: this.pos.y },
            { x: this.pos.x + this.width / 2, y: this.pos.y }];
    }
    return Player;
}());
var Ball = (function () {
    function Ball() {
        this.pos = { x: canv_width / 2, y: canv_height / 2 };
        this.velocity = { x: 0, y: 0.1 };
        this.size = 2;
    }
    return Ball;
}());
var Block = (function () {
    function Block(pos) {
        this.pos = pos;
        this.points = [{ x: pos.x - BLOCK_WIDTH / 2, y: pos.y },
            { x: pos.x + BLOCK_WIDTH / 2, y: pos.y }];
    }
    return Block;
}());
function move(pos, vel, delta) {
    return addVec(pos, multVecI(vel, delta));
}
function init_some_blocks(start_pos) {
    for (var i = 0; i < NUM_BLOCKS_X; i++) {
        for (var j = 0; j < NUM_BLOCKS_Y; j++) {
            var block = new Block({
                x: start_pos.x + i * BLOCK_WIDTH * BLOCK_PAD_X,
                y: start_pos.y + j * BLOCK_HEIGHT * BLOCK_PAD_Y,
            });
            blocks.push(block);
        }
    }
}
player = new Player();
ball = new Ball();
init_some_blocks({ x: BLOCK_PAD_X + BLOCK_WIDTH / 2 + 1, y: BLOCK_PAD_Y + BLOCK_HEIGHT / 2 + 1 });
render(ctx);
requestAnimationFrame(gameUpdate);
function render(ctx) {
    ctx.clearRect(0, 0, canv_width, canv_height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.moveTo(player.points[0].x, player.points[0].y);
    ctx.lineTo(player.points[1].x, player.points[1].y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.size, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (var i = 0; i < blocks.length; i++) {
        ctx.moveTo(blocks[i].points[0].x, blocks[i].points[0].y);
        ctx.lineTo(blocks[i].points[1].x, blocks[i].points[1].y);
        ctx.stroke();
    }
}
function gameUpdate(current_time) {
    if (running === true) {
        delta = current_time - last_time;
        last_time = current_time;
        ball.pos = move(ball.pos, ball.velocity, delta);
        if (pointNearLine(ball.pos, player.points[0], player.points[1], 10)) {
            var normal = normalizeVec(getNormal(player.points[0], player.points[1])[0]);
            ball.velocity = reflectVec(ball.velocity, normal);
        }
        render(ctx);
    }
    requestAnimationFrame(gameUpdate);
}
export function get_canvas() {
    return canvas;
}
export function start_game() {
    if (running === false) {
        last_time = performance.now();
    }
    running = true;
}
export function pause_game() {
    running = false;
    ctx.clearRect(0, 0, canv_width, canv_height);
}
export function get_name() {
    return 'breakout';
}
export function set_canvas_transform(transform) {
    canvas_transform = transform;
}
export function get_canvas_transform() {
    return canvas_transform;
}
window.addEventListener('keydown', capture_input);
window.addEventListener('keyup', clear_input);
function capture_input(e) {
    var found = false;
    input_stack.forEach(function (input) {
        if (input.code === e.code) {
            found = true;
        }
    });
    if (found === false) {
        input_stack.push({ code: e.code, frames: 0 });
    }
}
function clear_input(e) {
    input_stack.forEach(function (input, index) {
        if (input.code === e.code) {
            input_stack.splice(index, 1);
        }
    });
}
function handle_input(key_handler) {
    input_stack.forEach(function (input) {
        if (input.frames % 2 === 0) {
            key_handler(input.code);
        }
        input.frames += 1;
    });
}
//# sourceMappingURL=breakout.js.map