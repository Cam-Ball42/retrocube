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

if (!ctx) {
        throw new Error("Failed to load context");
}
class Entity {
        points: Array<Vector2>;
        dir: Vector2;
        speed: number;
        pos: Vector2;

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
                                break;

                        case "player":
                                const pos: Vector2 = {
                                        x: canv_width / 2,
                                        y: canv_height / 2
                                }
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
                ctx.closePath();
                ctx.stroke();
        }


        ctx.fillStyle = 'white';
        ctx.fillText(`Delta : ${delta}`, 10, 10, canv_width);
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
                        const aster: Entity = asteroids[i];
                        const zelta = Math.max(delta * aster.speed, 0.05);
                        const dist: Vector2 = multVecI(aster.dir, zelta);
                        asteroids[i].move(dist);
                        if (checkCollision(aster.points)) {
                                aster.dir = invertVec(aster.dir);
                        }



                }
                //Player
                handle_input(handle_keys);

                //Bullets
                for (let i = 0; i < bullets.length; i++) {
                        const bullet = bullets[i];
                        const dist: Vector2 = multVecI(bullet.dir, bullet.speed);
                        bullet.move(dist);

                        //check if out of bounds
                        for (let j = 0; j < bullet.points.length; j++) {
                                if (bullet.points[j].x < 0 || bullet.points[j].x > canv_width) {
                                        bullets.splice(i, 1);
                                        console.log("bullet deleted");
                                }
                        }
                        for (let j = 0; j < bullet.points.length; j++) {
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
//Maybe change check collision to also take another array of points so it 
//can handle game bounds or asteroids

function checkCollision(points: Array<Vector2>): boolean {
        for (let i = 0; i < points.length; i++) {
                const a_now = points[i];
                var a_next;
                if (i + 1 === points.length) {
                        a_next = points[0]

                }
                else { a_next = points[i + 1]; }

                //Check against game bounds

                for (let j = 0; j < game_bounds.length; j++) {
                        const g_now = game_bounds[j];
                        var g_next;
                        if (j + 1 === game_bounds.length) {
                                g_next = game_bounds[0];
                        }
                        else { g_next = game_bounds[j + 1]; }

                        if (didCollideLine(a_now, a_next, g_now, g_next)) {
                                return true;
                        }
                }



        }
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


type Vector2 = {
        x: number,
        y: number,
}

function invertVec(v: Vector2) {
        return { x: v.x * -1, y: v.y * -1 }
}
function multVec(v1: Vector2, v2: Vector2): Vector2 {
        return { x: v1.x * v2.x, y: v1.y * v2.y };
}
function multVecI(v1: Vector2, n: number): Vector2 {
        return { x: v1.x * n, y: v1.y * n };
}
function addVec(v1: Vector2, v2: Vector2): Vector2 {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
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
