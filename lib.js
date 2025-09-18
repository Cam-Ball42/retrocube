export function invertVec(v) {
    return { x: v.x * -1, y: v.y * -1 };
}
export function reflectVec(v, normal) {
    var dot = v.x * normal.x + v.y * normal.y;
    return {
        x: v.x - 2 * dot * normal.x,
        y: v.y - 2 * dot * normal.y
    };
}
export function multVec(v1, v2) {
    return { x: v1.x * v2.x, y: v1.y * v2.y };
}
export function multVecI(v1, n) {
    return { x: v1.x * n, y: v1.y * n };
}
export function divVecI(v1, n) {
    return { x: v1.x / n, y: v1.y / n };
}
export function addVec(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}
export function normalizeVec(v) {
    var length = Math.sqrt(v.x * v.x + v.y * v.y);
    return {
        x: v.x / length,
        y: v.y / length
    };
}
export function getNormal(v1, v2) {
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    return [{ x: -dy, y: dx }, { x: dy, y: -dx }];
}
export function rotatePoint(v, center, angle) {
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
export function rotatePoints(points, center, angle) {
    for (var i = 0; i < points.length; i++) {
        points[i] = rotatePoint(points[i], center, angle);
    }
}
export function checkCollision(on, against) {
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
export function checkCollisionWithResult(on, against) {
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
                return { did_collide: true, col_normal: normalized };
            }
        }
    }
    return { did_collide: false };
}
export function isOutOfBounds(points, width, height) {
    for (var j = 0; j < points.length; j++) {
        if (points[j].x < 0 || points[j].x > width) {
            return true;
        }
    }
    for (var j = 0; j < points.length; j++) {
        if (points[j].y < 0 || points[j].y > height) {
            return true;
        }
    }
    return false;
}
export function didCollideLine(p1, p2, p3, p4) {
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
export function get_random_bipolar() {
    var rand_vec = {
        x: [-1, 1][Math.floor(Math.random() * 2)],
        y: [-1, 1][Math.floor(Math.random() * 2)],
    };
    return rand_vec;
}
//# sourceMappingURL=lib.js.map