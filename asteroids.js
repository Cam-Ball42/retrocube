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
var debris = [];
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
                this.col_timeout = 0;
                break;
            case "player":
                this.pos = {
                    x: canv_width / 2,
                    y: canv_height / 2
                };
                this.height = 20;
                this.width = 10;
                this.points = [addVec({ x: -10, y: -this.height / 2 }, this.pos),
                    addVec({ x: 0, y: this.height - this.height / 2 }, this.pos),
                    addVec({ x: 10, y: -this.height / 2 }, this.pos)];
                this.dir = { x: 0, y: 1 };
                this.speed = 0.5;
                break;
            case "phaser":
                this.pos = addVec(player.pos, player.dir);
                this.points = [addVec(player.pos, multVecI(player.dir, player.height)), addVec(player.pos, multVecI(player.dir, player.height + 3))];
                this.dir = player.dir;
                this.speed = 1;
                break;
            case "debris":
                this.speed = 0.01;
                break;
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
        ctx.stroke();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    for (var i = 0; i < debris.length; i++) {
        ctx.beginPath();
        ctx.moveTo(debris[i].points[0].x, debris[i].points[0].y);
        ctx.lineTo(debris[i].points[1].x, debris[i].points[1].y);
        ctx.stroke();
    }
    ctx.fillStyle = 'white';
    ctx.fillText("Delta : ".concat(delta), 10, 10, canv_width);
    ctx.fillText("No. Asteroids: ".concat(asteroids.length), 10, 20, canv_width);
    ctx.fillText("No. Bullet: ".concat(bullets.length), 10, 30, canv_width);
    ctx.fillText("No. Debris: ".concat(debris.length), 10, 40, canv_width);
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
            if (aster.col_timeout > 0) {
                var col_result = checkCollisionWithResult(aster.points, game_bounds);
                if (col_result.did_collide === true) {
                    aster.dir = reflectVec(aster.dir, col_result.col_normal);
                    aster.col_timeout = -10;
                }
            }
            aster.col_timeout += 1;
        }
        handle_input(handle_keys);
        for (var i = 0; i < bullets.length; i++) {
            var bullet = bullets[i];
            var dist = multVecI(bullet.dir, bullet.speed);
            bullet.move(dist);
            if (isOutOfBounds(bullet.points)) {
                bullets.splice(i, 1);
            }
            for (var j = 0; j < asteroids.length; j++) {
                if (checkCollision(bullet.points, asteroids[j].points)) {
                    bullets.splice(i, 1);
                    explode_asteroid(asteroids[j], j);
                }
            }
        }
        for (var i = 0; i < debris.length; i++) {
            if (isOutOfBounds(debris[i].points)) {
                debris.splice(i, 1);
            }
        }
        for (var i = 0; i < debris.length; i++) {
            var dist = delta * debris[i].speed;
            debris[i].move(multVecI(debris[i].dir, dist));
        }
        render(ctx);
    }
    requestAnimationFrame(gameUpdate);
}
function checkCollision(on, against) {
    for (var i = 0; i < on.length; i++) {
        var a_now = on[i];
        var a_next;
        if (i + 1 === on.length) {
            a_next = on[0];
        }
        else {
            a_next = on[i + 1];
        }
        for (var j = 0; j < against.length; j++) {
            var g_now = against[j];
            var g_next;
            if (j + 1 === against.length) {
                g_next = against[0];
            }
            else {
                g_next = against[j + 1];
            }
            if (didCollideLine(a_now, a_next, g_now, g_next)) {
                return true;
            }
        }
    }
}
function checkCollisionWithResult(on, against) {
    for (var i = 0; i < on.length; i++) {
        var a_now = on[i];
        var a_next;
        if (i + 1 === on.length) {
            a_next = on[0];
        }
        else {
            a_next = on[i + 1];
        }
        for (var j = 0; j < against.length; j++) {
            var g_now = against[j];
            var g_next;
            if (j + 1 === against.length) {
                g_next = against[0];
            }
            else {
                g_next = against[j + 1];
            }
            if (didCollideLine(a_now, a_next, g_now, g_next)) {
                var normal = getNormal(g_now, g_next);
                var normalized = normalizeVec(normal[0]);
                console.log(normalized);
                return { did_collide: true, col_normal: normalized };
            }
        }
    }
    return { did_collide: false };
}
function isOutOfBounds(points) {
    for (var j = 0; j < points.length; j++) {
        if (points[j].x < 0 || points[j].x > canv_width) {
            return true;
        }
    }
    for (var j = 0; j < points.length; j++) {
        if (points[j].y < 0 || points[j].y > canv_height) {
            return true;
        }
    }
    return false;
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
function explode_asteroid(asteroid, index) {
    for (var i = 0; i < asteroid.points.length - 1; i++) {
        var now = asteroid.points[i];
        var next = asteroid.points[i + 1];
        var normal = getNormal(now, next);
        var pos = divVecI(addVec(now, next), 2);
        var new_debris = new Entity('debris');
        new_debris.dir = normal[0];
        new_debris.pos = pos;
        new_debris.points = [{ x: now.x, y: now.y }, { x: next.x, y: next.y }];
        debris.push(new_debris);
    }
    asteroids.splice(index, 1);
}
function invertVec(v) {
    return { x: v.x * -1, y: v.y * -1 };
}
function reflectVec(v, normal) {
    var dot = v.x * normal.x + v.y * normal.y;
    return {
        x: v.x - 2 * dot * normal.x,
        y: v.y - 2 * dot * normal.y
    };
}
function multVec(v1, v2) {
    return { x: v1.x * v2.x, y: v1.y * v2.y };
}
function multVecI(v1, n) {
    return { x: v1.x * n, y: v1.y * n };
}
function divVecI(v1, n) {
    return { x: v1.x / n, y: v1.y / n };
}
function addVec(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}
function normalizeVec(v) {
    var length = Math.sqrt(v.x * v.x + v.y * v.y);
    return {
        x: v.x / length,
        y: v.y / length
    };
}
function getNormal(v1, v2) {
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    return [{ x: -dy, y: dx }, { x: dy, y: -dx }];
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
    if (running === false) {
        last_time = performance.now();
    }
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