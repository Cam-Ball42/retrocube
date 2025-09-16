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
const game_bounds: Array<Vector2> = [{ x: 0, y: 0 }, { x: canv_width, y: 0 }
        , { x: canv_width, y: canv_height }, { x: 0, y: canv_height }];
const bullets: Array<Entity> = [];
const debris: Array<Entity> = [];

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
        col_timeout?: number;

        constructor(type: string) {
                //TODO
                switch (type) {
                        case "asteroid":
                                const rand_pos: Vector2 = {
                                        x: Math.max(Math.random() * canv_width / 1.5, 50),
                                        y: Math.max(Math.random() * canv_height / 1.5, 50)
                                };
                                this.pos = rand_pos;
                                const points = generate_points().map(point =>
                                        addVec(point, rand_pos));

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

        move(distance: Vector2) {
                this.pos = addVec(this.pos, distance);
                for (let i = 0; i < this.points.length; i++) {
                        this.points[i].x += distance.x;
                        this.points[i].y += distance.y;
                }
        }
}

const player = new Entity("player");
render(ctx);
requestAnimationFrame(gameUpdate);

function render(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, canv_width, canv_height);


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
        //DEBUG RENDER
        // for (let i = 0; i < asteroids.length; i++) {
        //         ctx.strokeStyle = 'blue';
        //         ctx.lineWidth = 2;
        //         ctx.beginPath();
        //
        //         for (let j = 0; j < asteroids[i].points.length - 1; j++) {
        //                 const now = asteroids[i].points[j];
        //                 const next = asteroids[i].points[j + 1];
        //                 let normal: Array<Vector2> = getNormal(now, next);
        //                 ctx.moveTo(normal[0].x + asteroids[i].pos.x, normal[0].y + asteroids[i].pos.y);
        //                 ctx.lineTo(normal[1].x + asteroids[i].pos.x, normal[1].y + asteroids[i].pos.y);
        //                 ctx.stroke();
        //
        //         }
        // }
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
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'red';
        for (let i = 0; i < bullets.length; i++) {
                const points = bullets[i].points;

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[1].x, points[1].y);
                ctx.stroke();
        }

        //Render Debris
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        for (let i = 0; i < debris.length; i++) {
                ctx.beginPath();
                ctx.moveTo(debris[i].points[0].x, debris[i].points[0].y);
                ctx.lineTo(debris[i].points[1].x, debris[i].points[1].y);
                ctx.stroke();
        }


        ctx.fillStyle = 'white';
        ctx.fillText(`Delta : ${delta}`, 10, 10, canv_width);
        ctx.fillText(`No. Asteroids: ${asteroids.length}`, 10, 20, canv_width);
        ctx.fillText(`No. Bullet: ${bullets.length}`, 10, 30, canv_width);
        ctx.fillText(`No. Debris: ${debris.length}`, 10, 40, canv_width);

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
                        const zelta = Math.max(delta * aster.speed, 0.05);
                        const dist = multVecI(aster.dir, zelta);
                        asteroids[i].move(dist);
                        if (aster.col_timeout > 0) {
                                const col_result = checkCollisionWithResult(aster.points, game_bounds);
                                if (col_result.did_collide === true) {
                                        aster.dir = reflectVec(aster.dir, col_result.col_normal);
                                        aster.col_timeout = -10;
                                }
                        }
                        aster.col_timeout += 1;
                }


                //Player
                handle_input(handle_keys);

                //Bullets
                for (let i = 0; i < bullets.length; i++) {
                        const bullet = bullets[i];
                        const dist: Vector2 = multVecI(bullet.dir, bullet.speed);
                        bullet.move(dist);

                        //check if out of bounds
                        if (isOutOfBounds(bullet.points)) {
                                bullets.splice(i, 1);
                        }

                        //collision with asteroids
                        for (let j = 0; j < asteroids.length; j++) {
                                if (checkCollision(bullet.points, asteroids[j].points)) {
                                        bullets.splice(i, 1);
                                        explode_asteroid(asteroids[j], j);
                                }
                        }
                }
                //Debris
                for (let i = 0; i < debris.length; i++) {
                        if (isOutOfBounds(debris[i].points)) {
                                debris.splice(i, 1);
                        }
                }
                for (let i = 0; i < debris.length; i++) {
                        const dist = delta * debris[i].speed;
                        debris[i].move(multVecI(debris[i].dir, dist));
                }

                render(ctx);
        }
        requestAnimationFrame(gameUpdate);
}

function checkCollision(on: Array<Vector2>, against: Array<Vector2>): boolean {
        for (let i = 0; i < on.length; i++) {
                const a_now = on[i];
                var a_next;
                if (i + 1 === on.length) {
                        a_next = on[0]

                }
                else { a_next = on[i + 1]; }


                for (let j = 0; j < against.length; j++) {
                        const g_now = against[j];
                        var g_next;
                        if (j + 1 === against.length) {
                                g_next = against[0];
                        }
                        else { g_next = against[j + 1]; }

                        if (didCollideLine(a_now, a_next, g_now, g_next)) {
                                return true;
                        }
                }
        }
}
type ColResult = {
        did_collide: boolean,
        col_normal?: Vector2,
}

function checkCollisionWithResult(on: Array<Vector2>, against: Array<Vector2>): ColResult {
        for (let i = 0; i < on.length; i++) {
                const a_now = on[i];
                var a_next;
                if (i + 1 === on.length) {
                        a_next = on[0]

                }
                else { a_next = on[i + 1]; }


                for (let j = 0; j < against.length; j++) {
                        const g_now = against[j];
                        var g_next;
                        if (j + 1 === against.length) {
                                g_next = against[0];
                        }
                        else { g_next = against[j + 1]; }

                        if (didCollideLine(a_now, a_next, g_now, g_next)) {
                                const normal = getNormal(g_now, g_next);
                                const normalized = normalizeVec(normal[0]);
                                console.log(normalized);
                                return { did_collide: true, col_normal: normalized };
                        }
                }
        }
        return { did_collide: false }
}

function isOutOfBounds(points: Array<Vector2>): boolean {
        for (let j = 0; j < points.length; j++) {
                if (points[j].x < 0 || points[j].x > canv_width) {
                        return true;
                }
        }
        for (let j = 0; j < points.length; j++) {
                if (points[j].y < 0 || points[j].y > canv_height) {
                        return true;
                }
        }
        return false;
}

function didCollideLine(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): boolean {
        const uA = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
                ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
        const uB = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
                ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));

        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
                return true;
        }
        else { return false; }


}

function get_random_bipolar(): Vector2 {
        const rand_vec: Vector2 = {
                x: [-1, 1][Math.floor(Math.random() * 2)],
                y: [-1, 1][Math.floor(Math.random() * 2)],
        }
        return rand_vec;

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

function explode_asteroid(asteroid: Entity, index: number) {

        for (let i = 0; i < asteroid.points.length - 1; i++) {
                const now = asteroid.points[i];
                const next = asteroid.points[i + 1];
                const normal = getNormal(now, next);

                const pos = divVecI(addVec(now, next), 2);
                const new_debris = new Entity('debris');
                new_debris.dir = normal[0];
                new_debris.pos = pos;
                new_debris.points = [{ x: now.x, y: now.y }, { x: next.x, y: next.y }];

                debris.push(new_debris);


        }
        asteroids.splice(index, 1);
}


type Vector2 = {
        x: number,
        y: number,
}

function invertVec(v: Vector2) {
        return { x: v.x * -1, y: v.y * -1 }
}
function reflectVec(v: Vector2, normal: Vector2): Vector2 {
        const dot = v.x * normal.x + v.y * normal.y;
        return {
                x: v.x - 2 * dot * normal.x,
                y: v.y - 2 * dot * normal.y
        };
}
function multVec(v1: Vector2, v2: Vector2): Vector2 {
        return { x: v1.x * v2.x, y: v1.y * v2.y };
}
function multVecI(v1: Vector2, n: number): Vector2 {
        return { x: v1.x * n, y: v1.y * n };
}
function divVecI(v1: Vector2, n: number): Vector2 {
        return { x: v1.x / n, y: v1.y / n };
}
function addVec(v1: Vector2, v2: Vector2): Vector2 {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
}
function normalizeVec(v: Vector2) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y);
        return {
                x: v.x / length,
                y: v.y / length
        };
}

function getNormal(v1: Vector2, v2: Vector2): Array<Vector2> {
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        return [{ x: -dy, y: dx }, { x: dy, y: -dx }];
}
function rotatePoint(v: Vector2, center: Vector2, angle: number): Vector2 {
        const translated_x = v.x - center.x;
        const translated_y = v.y - center.y;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotated_x = translated_x * cos - translated_y * sin;
        const rotated_y = translated_x * sin + translated_y * cos;

        return {
                x: rotated_x + center.x,
                y: rotated_y + center.y,
        }

}

function rotatePoints(points: Array<Vector2>, center: Vector2, angle: number) {
        for (let i = 0; i < points.length; i++) {
                points[i] = rotatePoint(points[i], center, angle);
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
}

export function set_canvas_transform(transform: any) {
        canvas_transform = transform;
}
export function get_canvas_transform() {
        return canvas_transform;
}

window.addEventListener('keydown', capture_input);
window.addEventListener('keyup', clear_input);
var input_stack: Array<Input> = []
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
        const rotation_speed = Math.PI / 32;
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
