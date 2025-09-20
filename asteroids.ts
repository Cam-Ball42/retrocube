import { Vector2, addVec, reflectVec, normalizeVec, multVecI, multVec, divVecI, invertVec, rotatePoint, rotatePoints, checkCollision, checkCollisionWithResult, ColResult, didCollideLine, isOutOfBounds, get_random_bipolar, getNormal } from "./lib.js";

const canv_width = 400;
const canv_height = 400;

const canvas = document.createElement('canvas');
canvas.width = canv_width;
canvas.height = canv_height;

var ctx = canvas.getContext("2d");
var canvas_transform: any;

var last_time = 0;
var delta = 0;
var running = false;

const asteroids: Array<Entity> = [];
const game_bounds: Array<Vector2> =
        [{ x: 0, y: 0 },
        { x: canv_width, y: 0 },
        { x: canv_width, y: canv_height },
        { x: 0, y: canv_height }];
const bounds_pad = 50;
const asteroid_bounds: Array<Vector2> =
        [{ x: -bounds_pad, y: -bounds_pad },
        { x: canv_width + bounds_pad, y: -bounds_pad },
        { x: canv_width + bounds_pad, y: canv_height + bounds_pad },
        { x: -bounds_pad, y: canv_height + bounds_pad }];
const bullets: Array<Entity> = [];
const debris: Array<Entity> = [];
const debris_lifetime = 125;

var input_stack: Array<Input> = []

if (!ctx) {
        throw new Error("Failed to load context");
}
class Entity {
        points: Array<Vector2>;
        dir: Vector2;
        speed: number;
        pos: Vector2;
        height?: number;
        width?: number;
        frame_counter?: number;
        rotation_speed?: number;

        constructor(type: string) {
                //TODO
                switch (type) {
                        case "asteroid":
                                let spawn_pad = bounds_pad - 20;
                                let randx: number;
                                let randy: number;
                                if (Math.random() > 0.5) {
                                        randx = Math.random() * (canv_width + spawn_pad) - spawn_pad;
                                        if (Math.random() > 0.5) {
                                                randy = Math.random() * spawn_pad * -1
                                        }
                                        else {
                                                randy = Math.random() * spawn_pad + canv_height
                                        }
                                }
                                else {
                                        if (Math.random() > 0.5) {
                                                randx = Math.random() * spawn_pad * -1
                                        }
                                        else {
                                                randx = Math.random() * spawn_pad + canv_width
                                        }

                                        randy = Math.random() * (canv_height + spawn_pad) - spawn_pad
                                }

                                this.pos = { x: randx, y: randy };
                                const points = generate_points().map(point =>
                                        addVec(point, this.pos));

                                this.points = points;
                                this.dir = get_random_bipolar();
                                this.speed = 0.05;
                                this.frame_counter = 0; //collision timeout
                                const rot_dir = [-1, 1][Math.floor(Math.random() * 2)];
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
                                this.frame_counter = 0; //for bullet cooldown

                                break;

                        case "phaser":
                                this.pos = addVec(player.pos, player.dir);
                                this.points = [addVec(player.pos, multVecI(player.dir, player.height)), addVec(player.pos, multVecI(player.dir, player.height + 15))];
                                this.dir = player.dir;
                                this.speed = 0.25;
                                break;
                        case "debris":
                                this.speed = 0.025;
                                this.frame_counter = 0; //for opacity
                                break;
                }
        }

        move(distance: Vector2) {
                this.pos = addVec(this.pos, distance);
                for (let i = 0; i < this.points.length; i++) {
                        this.points[i] = addVec(this.points[i], distance);
                }
        }
}

const player = new Entity("player");
render(ctx);
requestAnimationFrame(gameUpdate);

function render(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, canv_width, canv_height);

        //Render Debris
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        for (let i = 0; i < debris.length; i++) {
                const res = (debris_lifetime - debris[i].frame_counter) / debris_lifetime;
                ctx.globalAlpha = res;
                ctx.beginPath();
                ctx.moveTo(debris[i].points[0].x, debris[i].points[0].y);
                ctx.lineTo(debris[i].points[1].x, debris[i].points[1].y);
                ctx.lineTo(debris[i].points[2].x, debris[i].points[2].y);
                ctx.closePath();
                ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        //Render Asteroids
        for (let i = 0; i < asteroids.length; i++) {
                ctx.lineWidth = 5;
                ctx.strokeStyle = 'white';

                ctx.beginPath();
                for (let j = 0; j < asteroids[i].points.length - 1; j++) {

                        const now = asteroids[i].points[j];
                        const next = asteroids[i].points[j + 1];

                        if (j === 0) {
                                ctx.moveTo(now.x, now.y);
                        }

                        ctx.lineTo(next.x, next.y);
                }
                ctx.closePath();
                ctx.stroke();
        }

        //Render Player
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'green';
        ctx.beginPath()
        for (let i = 0; i < player.points.length - 1; i++) {
                const now = player.points[i];
                const next = player.points[i + 1];

                if (i === 0) {
                        ctx.moveTo(now.x, now.y);
                }

                ctx.lineTo(next.x, next.y);

        }
        ctx.closePath();
        ctx.stroke();

        //Render Bullets
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'red';
        for (let i = 0; i < bullets.length; i++) {
                const points = bullets[i].points;

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[1].x, points[1].y);
                ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = 'white';
        ctx.fillText(`Delta : ${delta}`, 10, 10, canv_width);
        ctx.fillText(`No. Asteroids: ${asteroids.length}`, 10, 20, canv_width);
        ctx.fillText(`No. Bullet: ${bullets.length}`, 10, 30, canv_width);
        ctx.fillText(`No. Debris: ${debris.length}`, 10, 40, canv_width);
        ctx.fillText(`Input stack : ${input_stack.map(input => input.code)}`, 10, 50, canv_width);

}

function gameUpdate(current_time: number) {
        if (running === true) {
                delta = current_time - last_time;
                last_time = current_time;
                //Spawn Asteroids
                if (asteroids.length < 10) {
                        asteroids.push(new Entity("asteroid"));
                }
                //Asteroid Movement
                for (let i = 0; i < asteroids.length; i++) {
                        const aster = asteroids[i];


                        const dist = multVecI(aster.dir, delta * aster.speed);
                        asteroids[i].move(dist);
                        if (aster.frame_counter > 0) {
                                const col_result = checkCollisionWithResult(aster.points, asteroid_bounds);
                                if (col_result.did_collide === true) {
                                        aster.dir = reflectVec(aster.dir, col_result.col_normal);
                                        aster.frame_counter = -10;
                                }
                        }
                        aster.frame_counter += 1;
                        rotatePoints(aster.points, aster.pos, aster.rotation_speed);

                        if (isOutOfBounds(aster.points, -bounds_pad - 10, -bounds_pad - 10, canv_width + bounds_pad + 10, canv_height + bounds_pad + 10)) {
                                asteroids.splice(i, 1);
                                console.log("Asteroid out of bounds");
                        }

                }

                //Player
                handle_input(handle_keys);
                if (player.frame_counter > 0) {
                        player.frame_counter -= 1;
                }

                //Bullets
                for (let i = 0; i < bullets.length; i++) {
                        const bullet = bullets[i];
                        const dist: Vector2 = multVecI(bullet.dir, bullet.speed * delta);
                        bullet.move(dist);

                        //check if out of bounds
                        if (isOutOfBounds(bullet.points, 0, 0, canv_width, canv_height)) {
                                bullets.splice(i, 1);
                                continue;
                        }

                        //collision with asteroids
                        for (let j = 0; j < asteroids.length; j++) {
                                if (checkCollision(bullet.points, asteroids[j].points)) {
                                        bullets.splice(i, 1);
                                        explode_entity(asteroids[j], j);
                                }
                        }
                }
                //Debris
                for (let i = 0; i < debris.length; i++) {
                        debris[i].frame_counter += 1;

                        const dist = delta * debris[i].speed;
                        debris[i].move(multVecI(debris[i].dir, dist));

                        if (debris[i].frame_counter >= debris_lifetime) {
                                debris.splice(i, 1);
                                continue
                        }
                        else if (isOutOfBounds(debris[i].points, 0, 0, canv_width, canv_height)) {
                                debris.splice(i, 1);
                        }
                }

                render(ctx);
        }
        requestAnimationFrame(gameUpdate);
}


function generate_points(): Array<Vector2> {
        const max_mag = 24;
        const min_mag = 10;

        const directions: Array<Vector2> = [
                { x: 0, y: 1 },   // North
                { x: 1, y: 1 },   // Northeast
                { x: 1, y: 0 },   // East
                { x: 1, y: -1 },  // Southeast
                { x: 0, y: -1 },  // South
                { x: -1, y: -1 }, // Southwest
                { x: -1, y: 0 },  // West
                { x: -1, y: 1 }   // Northwest
        ];

        for (let i = 0; i < directions.length; i++) {
                const randx = Math.max(Math.random() * max_mag, min_mag);
                const randy = Math.max(Math.random() * max_mag, min_mag);

                directions[i].x *= randx;
                directions[i].y *= randy;
        }
        return directions;
}

function explode_entity(entity: Entity, index: number) {

        for (let i = 0; i < entity.points.length - 1; i++) {
                const now = entity.points[i];
                const next = entity.points[i + 1];
                const normal = getNormal(now, next);

                const pos = divVecI(addVec(now, next), 2);
                const new_debris = new Entity('debris');
                new_debris.dir = normalizeVec(normal[0]);
                new_debris.pos = pos;
                new_debris.points = [{ x: entity.pos.x, y: entity.pos.y }, { x: now.x, y: now.y }, { x: next.x, y: next.y }];

                debris.push(new_debris);


        }
        //check if player of asteroid, can probably do this better
        if (entity.points.length > 3) {
                asteroids.splice(index, 1);
        }
}



export function get_canvas(): HTMLCanvasElement {
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
        return "asteroids"
}

export function set_canvas_transform(transform: any) {
        canvas_transform = transform;
}
export function get_canvas_transform() {
        return canvas_transform;
}

window.addEventListener('keydown', capture_input);
window.addEventListener('keyup', clear_input);
type Input = {
        code: string,
        frames: number,
}
function capture_input(e: KeyboardEvent) {
        var found = false;
        input_stack.forEach((input) => {
                if (input.code === e.code) {
                        found = true;
                }
        });
        if (found === false) { input_stack.push({ code: e.code, frames: 0 }) }
}
function clear_input(e: KeyboardEvent) {
        input_stack.forEach((input, index) => {
                if (input.code === e.code) {
                        input_stack.splice(index, 1);
                }
        })
}
function handle_input(key_handler: Function) {
        input_stack.forEach((input) => {
                if (input.frames % 2 === 0) {
                        key_handler(input.code);
                }
                input.frames += 1;
        })
}
function handle_keys(code: string) {
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
