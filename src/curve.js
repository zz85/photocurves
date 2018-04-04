let points;
let ys = [], xs = [], ks = [];

function process_points(_points) {
    points = _points
        .map(p => ({ x: p.t, y: p.v }))
        .filter(p => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);

    xs = points.map(p => p.x)
    ys = points.map(p => p.y)
    ks = points.concat();

    CSPL.getNaturalKs(xs, ys, ks);
}

process_points([{ t: 0, v: 0}, { t: 1, v: 1 } ]);

// GLOBAL curve
const curve = Spline;

function Spline(t) {
    if (t <= points[0].x) return points[0].y;
	if (t >= points[points.length-1].x) return points[points.length-1].y;

	return clamp(CSPL.evalSpline(t, xs, ys, ks), 0, 1)
	// CSPL.evalSpline(t, xs, ys, ks)
	// linearCurve(t, points);
}

/**
 * Linear Curve Interpolation
 */

function linearCurve(t, points) {
	const find_index = points.findIndex((point) => {
		return point.x > t;
	});

	const last_point = find_index > -1 ?
		find_index < 1 ? 1 :
			find_index : points.length - 1;

	const first = points[last_point - 1];
	const last = points[last_point];

	if (t < first.x) { return first.y };
	if (t > last.x) { return last.y };

	return (t - first.x) / (last.x - first.x) * (last.y - first.y) + first.y;
}