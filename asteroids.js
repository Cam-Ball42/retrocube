import { addVec, reflectVec, normalizeVec, multVecI, divVecI, rotatePoint, rotatePoints, checkCollision, checkCollisionWithResult, isOutOfBounds, get_random_bipolar, getNormal } from "./lib.js";
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
var game_bounds = [{ x: 0, y: 0 },
    { x: canv_width, y: 0 },
    { x: canv_width, y: canv_height },
    { x: 0, y: canv_height }];
var bounds_pad = 50;
var asteroid_bounds = [{ x: -bounds_pad, y: -bounds_pad },
    { x: canv_width + bounds_pad, y: -bounds_pad },
    { x: canv_width + bounds_pad, y: canv_height + bounds_pad },
    { x: -bounds_pad, y: canv_height + bounds_pad }];
var bullets = [];
var debris = [];
var debris_lifetime = 125;
var input_stack = [];
if (!ctx) {
    throw new Error("Failed to load context");
}
var Entity = (function () {
    function Entity(type) {
        var _this = this;
        switch (type) {
            case "asteroid":
                var spawn_pad = bounds_pad - 20;
                var randx = void 0;
                var randy = void 0;
                if (Math.random() > 0.5) {
                    randx = Math.random() * (canv_width + spawn_pad) - spawn_pad;
                    if (Math.random() > 0.5) {
                        randy = Math.random() * spawn_pad * -1;
                    }
                    else {
                        randy = Math.random() * spawn_pad + canv_height;
                    }
                }
                else {
                    if (Math.random() > 0.5) {
                        randx = Math.random() * spawn_pad * -1;
                    }
                    else {
                        randx = Math.random() * spawn_pad + canv_width;
                    }
                    randy = Math.random() * (canv_height + spawn_pad) - spawn_pad;
                }
                this.pos = { x: randx, y: randy };
                var points = generate_points().map(function (point) {
                    return addVec(point, _this.pos);
                });
                this.points = points;
                this.dir = get_random_bipolar();
                this.speed = 0.05;
                this.frame_counter = 0;
                var rot_dir = [-1, 1][Math.floor(Math.random() * 2)];
                this.rotation_speed =
                    Math.max(Math.random() * Math.PI / 256, Math.PI / 512) * rot_dir;
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
                this.rotation_speed = Math.PI / 256;
                this.frame_counter = 0;
                break;
            case "phaser":
                this.pos = addVec(player.pos, player.dir);
                this.points = [addVec(player.pos, multVecI(player.dir, player.height)), addVec(player.pos, multVecI(player.dir, player.height + 15))];
                this.dir = player.dir;
                this.speed = 0.25;
                break;
            case "debris":
                this.speed = 0.025;
                this.frame_counter = 0;
                break;
        }
    }
    Entity.prototype.move = function (distance) {
        this.pos = addVec(this.pos, distance);
        for (var i = 0; i < this.points.length; i++) {
            this.points[i] = addVec(this.points[i], distance);
        }
    };
    return Entity;
}());
var player = new Entity("player");
render(ctx);
requestAnimationFrame(gameUpdate);
function render(ctx) {
    ctx.clearRect(0, 0, canv_width, canv_height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    for (var i = 0; i < debris.length; i++) {
        var res = (debris_lifetime - debris[i].frame_counter) / debris_lifetime;
        ctx.globalAlpha = res;
        ctx.beginPath();
        ctx.moveTo(debris[i].points[0].x, debris[i].points[0].y);
        ctx.lineTo(debris[i].points[1].x, debris[i].points[1].y);
        ctx.lineTo(debris[i].points[2].x, debris[i].points[2].y);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
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
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'red';
    for (var i = 0; i < bullets.length; i++) {
        var points = bullets[i].points;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'white';
    ctx.fillText("Delta : ".concat(delta), 10, 10, canv_width);
    ctx.fillText("No. Asteroids: ".concat(asteroids.length), 10, 20, canv_width);
    ctx.fillText("No. Bullet: ".concat(bullets.length), 10, 30, canv_width);
    ctx.fillText("No. Debris: ".concat(debris.length), 10, 40, canv_width);
    ctx.fillText("Input stack : ".concat(input_stack.map(function (input) { return input.code; })), 10, 50, canv_width);
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
            var dist = multVecI(aster.dir, delta * aster.speed);
            asteroids[i].move(dist);
            if (aster.frame_counter > 0) {
                var col_result = checkCollisionWithResult(aster.points, asteroid_bounds);
                if (col_result.did_collide === true) {
                    aster.dir = reflectVec(aster.dir, col_result.col_normal);
                    aster.frame_counter = -10;
                }
            }
            aster.frame_counter += 1;
            rotatePoints(aster.points, aster.pos, aster.rotation_speed);
        }
        handle_input(handle_keys);
        if (player.frame_counter > 0) {
            player.frame_counter -= 1;
        }
        for (var i = 0; i < bullets.length; i++) {
            var bullet = bullets[i];
            var dist = multVecI(bullet.dir, bullet.speed * delta);
            bullet.move(dist);
            if (isOutOfBounds(bullet.points, canv_width, canv_height)) {
                bullets.splice(i, 1);
            }
            for (var j = 0; j < asteroids.length; j++) {
                if (checkCollision(bullet.points, asteroids[j].points)) {
                    bullets.splice(i, 1);
                    explode_entity(asteroids[j], j);
                }
            }
        }
        for (var i = 0; i < debris.length; i++) {
            debris[i].frame_counter += 1;
            var dist = delta * debris[i].speed;
            debris[i].move(multVecI(debris[i].dir, dist));
            if (debris[i].frame_counter >= debris_lifetime) {
                debris.splice(i, 1);
            }
            else if (isOutOfBounds(debris[i].points, canv_width, canv_height)) {
                debris.splice(i, 1);
            }
        }
        render(ctx);
    }
    requestAnimationFrame(gameUpdate);
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
function explode_entity(entity, index) {
    for (var i = 0; i < entity.points.length - 1; i++) {
        var now = entity.points[i];
        var next = entity.points[i + 1];
        var normal = getNormal(now, next);
        var pos = divVecI(addVec(now, next), 2);
        var new_debris = new Entity('debris');
        new_debris.dir = normalizeVec(normal[0]);
        new_debris.pos = pos;
        new_debris.points = [{ x: entity.pos.x, y: entity.pos.y }, { x: now.x, y: now.y }, { x: next.x, y: next.y }];
        debris.push(new_debris);
    }
    if (entity.points.length > 3) {
        asteroids.splice(index, 1);
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
    switch (code) {
        case "KeyW":
        case "ArrowUp":
            player.move(multVecI(player.dir, player.speed * delta));
            break;
        case "KeyD":
        case "ArrowRight":
            rotatePoints(player.points, player.pos, player.rotation_speed * delta);
            player.dir = rotatePoint(player.dir, { x: 0, y: 0 }, player.rotation_speed * delta);
            break;
        case "KeyA":
        case "ArrowLeft":
            rotatePoints(player.points, player.pos, -player.rotation_speed * delta);
            player.dir = rotatePoint(player.dir, { x: 0, y: 0 }, -player.rotation_speed * delta);
            break;
        case "Space":
            if (player.frame_counter === 0) {
                bullets.push(new Entity('phaser'));
                player.frame_counter = 20;
            }
    }
}
//# sourceMappingURL=asteroids.js.map