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
var asteroids = [];
var game_bounds = [{ x: 0, y: 0 }, { x: canv_width, y: 0 },
    { x: canv_width, y: canv_height }, { x: 0, y: canv_height }];
var bullets = [];
if (!ctx) {
    throw new Error("Failed to load context");
}
var Entity = (function () {
    function Entity(type) {
        switch (type) {
            case "asteroid":
                var rand_pos_1 = {
                    x: Math.max(Math.random() * canv_width / 1.5, 50),
                    y: Math.max(Math.random() * canv_height / 1.5, 50)
                };
                this.pos = rand_pos_1;
                var points = generate_points().map(function (point) {
                    return addVec(point, rand_pos_1);
                });
                this.points = points;
                this.dir = get_random_bipolar();
                this.speed = 0.05;
                break;
            case "player":
                var pos = {
                    x: canv_width / 2,
                    y: canv_height / 2
                };
                this.pos = pos;
                this.points = [addVec({ x: -10, y: 0 }, pos),
                    addVec({ x: 0, y: 12 }, pos),
                    addVec({ x: 10, y: 0 }, pos)];
                this.dir = { x: 0, y: 1 };
                this.speed = 0.5;
                break;
            case "phaser":
                this.pos = player.pos;
                this.dir = player.dir;
                this.speed = 1;
                this.points = [{ x: player.pos.x, y: player.pos.y },
                    addVec(player.pos, multVecI(player.dir, 10))];
        }
    }
    Entity.prototype.move = function (distance) {
        this.pos = addVec(this.pos, distance);
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].x += distance.x;
            this.points[i].y += distance.y;
        }
    };
    return Entity;
}());
var player = new Entity("player");
render(ctx);
requestAnimationFrame(gameUpdate);
function render(ctx) {
    ctx.clearRect(0, 0, canv_width, canv_height);
    for (var i = 0; i < asteroids.length; i++) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        for (var j = 0; j < asteroids[i].points.length - 1; j++) {
            var now = asteroids[i].points[j];
            var next = asteroids[i].points[j + 1];
            if (j === 0) {
                ctx.moveTo(now.x, now.y);
            }
            ctx.lineTo(next.x, next.y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    for (var i = 0; i < player.points.length - 1; i++) {
        var now = player.points[i];
        var next = player.points[i + 1];
        if (i === 0) {
            ctx.moveTo(now.x, now.y);
        }
        ctx.lineTo(next.x, next.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'red';
    for (var i = 0; i < bullets.length; i++) {
        var points = bullets[i].points;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.fillStyle = 'white';
    ctx.fillText("Delta : ".concat(delta), 10, 10, canv_width);
}
function gameUpdate(current_time) {
    if (running === true) {
        delta = current_time - last_time;
        last_time = current_time;
        if (asteroids.length < 10) {
            asteroids.push(new Entity("asteroid"));
        }
        for (var i = 0; i < asteroids.length; i++) {
            var aster = asteroids[i];
            var zelta = Math.max(delta * aster.speed, 0.05);
            var dist = multVecI(aster.dir, zelta);
            asteroids[i].move(dist);
            if (checkCollision(aster.points)) {
                aster.dir = invertVec(aster.dir);
            }
        }
        handle_input(handle_keys);
        for (var i = 0; i < bullets.length; i++) {
            var bullet = bullets[i];
            var dist = multVecI(bullet.dir, bullet.speed);
            bullet.move(dist);
            for (var j = 0; j < bullet.points.length; j++) {
                if (bullet.points[j].x < 0 || bullet.points[j].x > canv_width) {
                    bullets.splice(i, 1);
                    console.log("bullet deleted");
                }
            }
            for (var j = 0; j < bullet.points.length; j++) {
                if (bullet.points[j].y < 0 || bullet.points[j].y > canv_height) {
                    bullets.splice(i, 1);
                    console.log("bullet deleted");
                }
            }
        }
        render(ctx);
    }
    requestAnimationFrame(gameUpdate);
}
function checkCollision(points) {
    for (var i = 0; i < points.length; i++) {
        var a_now = points[i];
        var a_next;
        if (i + 1 === points.length) {
            a_next = points[0];
        }
        else {
            a_next = points[i + 1];
        }
        for (var j = 0; j < game_bounds.length; j++) {
            var g_now = game_bounds[j];
            var g_next;
            if (j + 1 === game_bounds.length) {
                g_next = game_bounds[0];
            }
            else {
                g_next = game_bounds[j + 1];
            }
            if (didCollideLine(a_now, a_next, g_now, g_next)) {
                return true;
            }
        }
    }
}
function didCollideLine(p1, p2, p3, p4) {
    var uA = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
        ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
    var uB = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
        ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true;
    }
    else {
        return false;
    }
}
function get_random_bipolar() {
    var rand_vec = {
        x: [-1, 1][Math.floor(Math.random() * 2)],
        y: [-1, 1][Math.floor(Math.random() * 2)],
    };
    return rand_vec;
}
function generate_points() {
    var max_mag = 24;
    var min_mag = 10;
    var directions = [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: -1 },
        { x: -1, y: -1 },
        { x: -1, y: 0 },
        { x: -1, y: 1 }
    ];
    for (var i = 0; i < directions.length; i++) {
        var randx = Math.max(Math.random() * max_mag, min_mag);
        var randy = Math.max(Math.random() * max_mag, min_mag);
        directions[i].x *= randx;
        directions[i].y *= randy;
    }
    return directions;
}
function invertVec(v) {
    return { x: v.x * -1, y: v.y * -1 };
}
function multVec(v1, v2) {
    return { x: v1.x * v2.x, y: v1.y * v2.y };
}
function multVecI(v1, n) {
    return { x: v1.x * n, y: v1.y * n };
}
function addVec(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}
function rotatePoint(v, center, angle) {
    var translated_x = v.x - center.x;
    var translated_y = v.y - center.y;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var rotated_x = translated_x * cos - translated_y * sin;
    var rotated_y = translated_x * sin + translated_y * cos;
    return {
        x: rotated_x + center.x,
        y: rotated_y + center.y,
    };
}
function rotatePoints(points, center, angle) {
    for (var i = 0; i < points.length; i++) {
        points[i] = rotatePoint(points[i], center, angle);
    }
}
export function get_canvas() {
    return canvas;
}
export function start_game() {
    running = true;
}
export function pause_game() {
    running = false;
}
export function set_canvas_transform(transform) {
    canvas_transform = transform;
}
export function get_canvas_transform() {
    return canvas_transform;
}
window.addEventListener('keydown', capture_input);
window.addEventListener('keyup', clear_input);
var input_stack = [];
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
function handle_keys(code) {
    var rotation_speed = Math.PI / 32;
    switch (code) {
        case "ArrowUp":
            player.move(multVecI(player.dir, player.speed * delta));
            break;
        case "ArrowRight":
            rotatePoints(player.points, player.pos, rotation_speed);
            player.dir = rotatePoint(player.dir, { x: 0, y: 0 }, rotation_speed);
            break;
        case "ArrowLeft":
            rotatePoints(player.points, player.pos, -rotation_speed);
            player.dir = rotatePoint(player.dir, { x: 0, y: 0 }, -rotation_speed);
            break;
        case "Space":
            bullets.push(new Entity('phaser'));
    }
}
//# sourceMappingURL=asteroids.js.map