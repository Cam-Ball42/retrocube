export type Vector2 = {
        x: number,
        y: number,
}

export function invertVec(v: Vector2) {
        return { x: v.x * -1, y: v.y * -1 }
}
export function reflectVec(v: Vector2, normal: Vector2): Vector2 {
        const dot = v.x * normal.x + v.y * normal.y;
        return {
                x: v.x - 2 * dot * normal.x,
                y: v.y - 2 * dot * normal.y
        };
}
export function multVec(v1: Vector2, v2: Vector2): Vector2 {
        return { x: v1.x * v2.x, y: v1.y * v2.y };
}
export function multVecI(v1: Vector2, n: number): Vector2 {
        return { x: v1.x * n, y: v1.y * n };
}
export function divVecI(v1: Vector2, n: number): Vector2 {
        return { x: v1.x / n, y: v1.y / n };
}
export function addVec(v1: Vector2, v2: Vector2): Vector2 {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
}
export function normalizeVec(v: Vector2) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y);
        return {
                x: v.x / length,
                y: v.y / length
        };
}

export function getNormal(v1: Vector2, v2: Vector2): Array<Vector2> {
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        return [{ x: -dy, y: dx }, { x: dy, y: -dx }];
}
export function rotatePoint(v: Vector2, center: Vector2, angle: number): Vector2 {
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

export function rotatePoints(points: Array<Vector2>, center: Vector2, angle: number) {
        for (let i = 0; i < points.length; i++) {
                points[i] = rotatePoint(points[i], center, angle);
        }
}
export function checkCollision(on: Array<Vector2>, against: Array<Vector2>): boolean {
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
export type ColResult = {
        did_collide: boolean,
        col_normal?: Vector2,
}

export function checkCollisionWithResult(on: Array<Vector2>, against: Array<Vector2>): ColResult {
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
                                return { did_collide: true, col_normal: normalized };
                        }
                }
        }
        return { did_collide: false }
}

export function isOutOfBounds(points: Array<Vector2>, width: number, height: number): boolean {
        for (let j = 0; j < points.length; j++) {
                if (points[j].x < 0 || points[j].x > width) {
                        return true;
                }
        }
        for (let j = 0; j < points.length; j++) {
                if (points[j].y < 0 || points[j].y > height) {
                        return true;
                }
        }
        return false;
}

export function didCollideLine(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): boolean {
        const uA = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
                ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
        const uB = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
                ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));

        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
                return true;
        }
        else { return false; }
}

export function get_random_bipolar(): Vector2 {
        const rand_vec: Vector2 = {
                x: [-1, 1][Math.floor(Math.random() * 2)],
                y: [-1, 1][Math.floor(Math.random() * 2)],
        }
        return rand_vec;
}
