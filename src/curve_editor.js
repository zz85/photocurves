const clamp = (v, min, max) => Math.min(Math.max(min, v), max);

/**
 * Event / Data management
 */

const notify = (action, ...params) => {
	listeners.forEach(listener => {
		listener.notify && listener.notify(action, ...params);
	})
}
const listeners = new Set;

const register = (target) => {
	listeners.add(target);
}

/**
 * Linear Curve Interpolation
 */

function linearCurve(t, points) {
	const find_index = points.findIndex((point) => {
		return point.t > t;
	});

	const last_point = find_index > -1 ?
		find_index < 1 ? 1 :
			find_index : points.length - 1;

	const first = points[last_point - 1];
	const last = points[last_point];

	if (t < first.t) { return first.v };
	if (t > last.t) { return last.v };

	return (t - first.t) / (last.t - first.t) * (last.v - first.v) + first.v;
}

/**
 * Graphic classes
 */

class GridArea {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.width = 100;
		this.height = 100;

		this.points = [
			new BoxElement(0, 0),
			new BoxElement(1, 1)
		]

		this.children = [
			// new CurveElement(x => x * x),
			new CurveElement(curve),
			...this.points
		];

		register(this);
		notify('POINTS_UPDATED', this.points);
	}

	isIn(ctx, x, y) {
		return true;
	}

	notify(type, point) {
		if (type === 'REMOVE_POINT') {
			const i = this.points.indexOf(point);
			if (i > 0 && i < this.points.length - 1) {
				this.points.splice(i, 1);
				this.children.splice(this.children.indexOf(point), 1);
				this.pos();
			}
			return;
		}

		if (type !== 'POINTS_MOVING' && type !== 'POINTS_STOPPED') return;
		this.pos();
	}

	pos() {
		this.points.sort((a, b) => {
			if (a.t > b.t) return 1;
			if (a.t < b.t) return -1;
			return 0;
		});

		notify('POINTS_UPDATED', this.points);
	}

	dblclick(x, y, a, b) {
		const box = new BoxElement(a / this.width, 1 - b / this.height);
		this.children.push(box);
		this.points.push(box);
		box.resize(this.width, this.height);
		notify('POINTS_MOVING');
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		this.children.forEach(child => child.resize && child.resize(width, height));
	}

	draw(ctx) {
		const { width, height } = this;
		ctx.strokeStyle = '#333';

		// draw borders
		ctx.beginPath();
		ctx.rect(0, 0, width, height);
		ctx.stroke();
		ctx.fillStyle = '#444';
		ctx.fill();

		const GRIDS = 4;

		// draw v grids
		for (let i = 0; i < GRIDS; i++) {
			ctx.beginPath();
			ctx.moveTo(i * width / GRIDS, 0);
			ctx.lineTo(i * width / GRIDS, height);
			ctx.stroke();
		}

		// draw h grids
		for (let i = 0; i < GRIDS; i++) {
			ctx.beginPath();
			ctx.moveTo(0, i * height / GRIDS);
			ctx.lineTo(width, i * height / GRIDS);
			ctx.stroke();
		}
	}
}

class BoxElement {
	constructor(t, v) {
		this.t = t;
		this.v = v;
		this.w = 8;

		this.resize(200, 200);
	}

	dblclick() {
		notify('REMOVE_POINT', this);
		return true
	}

	pos() {
		this.x = this.t * this.width;
		this.y = (1 - this.v) * this.height;
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		this.pos()
	}

	draw(ctx) {
		this.path(ctx);
		this.paint(ctx);
	}

	path(ctx) {
		const w = this.w;
		ctx.beginPath()
		ctx.rect(-w/2, -w/2, w, w);
	}

	paint(ctx) {
		ctx.lineWidth = 1;
		ctx.fillStyle = '#ddd'
		ctx.strokeStyle = '#fff'
		ctx.stroke();
	}

	isIn(ctx, x, y) {
		var w2 = this.w / 2;
		if (Math.abs(x) <= w2 && Math.abs(y) <= w2) {
			return true;
		}
		return false;
	}

	mousedown(x, y) {
		this.downx = x;
		this.downy = y;
		this.ox = this.x;
		this.oy = this.y;

		const mousemove = (e) => {
			const tx = (e.offsetX - this.downx) + this.ox;
			const ty = (e.offsetY - this.downy) + this.oy;

			this.t = clamp(tx / this.width, 0, 1);
			this.v = clamp(1 - (ty / this.height), 0, 1);
			this.pos();
			notify('POINTS_MOVING');
		}

		const mouseup = () => {
			document.body.removeEventListener('mousemove', mousemove)
			document.body.removeEventListener('mouseup', mouseup)
			notify('POINTS_STOPPED');
		}

		document.body.addEventListener('mousemove', mousemove)
		document.body.addEventListener('mouseup', mouseup)
		document.body.addEventListener('mousecancel', mouseup)
	}
}

class CurveElement {
	constructor(equation) {
		this.equation = equation || (x => x);
	}

	draw(ctx, { width, height }) {
		const eq = this.equation;

		let t = 0;
		let y = eq(t);
		ctx.beginPath();
		ctx.moveTo(0, (1 - y) * height);

		for (let x = 1; x <= width; x++) {
			t = x / width;
			y = eq(t)
			ctx.lineTo(x, (1 - y) * height)
		}

		ctx.lineWidth = 2;
		ctx.strokeStyle = '#999';
		ctx.stroke();
	}
}

class MapElement {
	constructor(width, height) {
		this.x = 0;
		this.y = 0;
		this.width = width;
		this.height = height;
	}

	draw(ctx) {
		const fn = curve || (x => x * x);
		// ctx.lineWidth = 1;
		// ctx.strokeStyle = '#ddd';
		for (let x = 0; x < this.width; x+=10) {
			ctx.beginPath();
			// ctx.moveTo(x, 0);
			// ctx.lineTo(fn(x / this.width) * this.width, this.height);
			ctx.moveTo(0, this.height - x);
			ctx.lineTo(this.height, this.height - fn(x / this.width) * this.width);

			ctx.stroke();
		}
	}
}

class CanvasElement {
	constructor(width, height, ...children) {
		this.width = width;
		this.height = height;
		const canvas = document.createElement('canvas');

		this.ctx = canvas.getContext('2d');
		this.canvas = canvas;

		canvas.addEventListener('mousemove', (e) => {
			if (this.dueRepaint) return
			this.dueRepaint = requestAnimationFrame(() => {
				this.dueRepaint = null;
				this._draw();
			});

			// console.log(e.offsetX, e.offsetY);
			const x = e.offsetX, y = e.offsetY;
			let inside = false;
			this.forIn(this, (child, cx, cy) => {
				if (child.isIn)
					{
					if (child.isIn(this.ctx, x - cx, y - cy)) {
						inside = true;
						if (child.mousemove) {
							// TODO
						}

						// mouseout
					};
				}
			})

			if (inside) {
				document.body.style.cursor = 'pointer';
			} else {
				document.body.style.cursor = 'default';
			}
		})

		canvas.addEventListener('mousedown', (e) => {
			const x = e.offsetX, y = e.offsetY;
			this.forIn(this, (child, cx, cy) => {
				if (child.isIn) {
					if (child.isIn(this.ctx, x - cx, y - cy)) {
						child.mousedown && child.mousedown(x, y, x - cx, y - cy);
					};
				}
			})
		})

		canvas.addEventListener('dblclick', (e) => {
			const x = e.offsetX, y = e.offsetY;
			this.forIn(this, (child, cx, cy) => {
				if (child.dblclick && child.isIn) {
					if (child.isIn(this.ctx, x - cx, y - cy))
						return child.dblclick(x, y, x - cx, y - cy);
				}
			})
		})

		this.children = children || [];

		this.resize();
		this._draw();
	}

	resize() {
		var dpr = window.devicePixelRatio;
		const { canvas, width, height } = this;
		canvas.width = dpr * width;
		canvas.height = dpr * height;

		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		canvas.style.border = '1px solid #ccc'
		this.dpr = dpr;
	}

	_draw() {
		const { ctx, dpr, width, height } = this;
		ctx.save();
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, width, height);

		this.drawChildren(this, ctx, { width, height });
		ctx.restore();
	}

	forEach(el, func) {
		const ctx = this.ctx;
		if (!el.children) return;

		el.children.forEach(child => {
			ctx.save();
			ctx.translate(child.x || 0, child.y || 0);
			func(child);
			this.forEach(child, func);
			ctx.restore();
		});
	}

	forIn(el, func, cx, cy) {
		if (!el.children) return;

		cx = cx || 0;
		cy = cy || 0;
		return el.children.some(child => {
			cx += child.x || 0;
			cy += child.y || 0;

			if (this.forIn(child, func, cx, cy)) return true;
			if (func(child, cx, cy)) return true;

			// ctx.restore();
			cx -= child.x || 0;
			cy -= child.y || 0;
		});
	}

	drawChildren(el, ctx, args) {
		this.forEach(el, (child) => {
			const new_args = child.draw(ctx, args);
			if (new_args && args) Object.assign(args, new_args);
		})
	}
}

class Editor {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.gridArea = new GridArea(40, 40);
		this.children = [this.gridArea];
	}

	draw(ctx) {
		const { width, height } = this;
		ctx.fillStyle = '#555'
		ctx.fillRect(0, 0, width, height);

		var padding = 40;
		var stripWidth =  10;
		var histoWidth = width - padding * 2;
		var histoHeight = height - padding * 2;

		this.gridArea.resize(histoWidth, histoHeight);

		// draw gradient strip
		var gradient = ctx.createLinearGradient(0, histoHeight + padding, 0, padding - stripWidth);
		gradient.addColorStop(0, '#000');
		gradient.addColorStop(1, '#fff');
		ctx.fillStyle = gradient;
		ctx.beginPath()
		ctx.rect(padding - stripWidth, padding, stripWidth, histoHeight);
		ctx.fill();
		// ctx.stroke();

		var gradient = ctx.createLinearGradient(0, padding, histoWidth, 0);
		gradient.addColorStop(0, '#000');
		gradient.addColorStop(1, '#fff');
		ctx.fillStyle = gradient;
		ctx.beginPath()
		ctx.rect(padding, padding + histoHeight, histoWidth, stripWidth);
		ctx.fill();

		return {
			width: histoWidth,
			height: histoHeight
		}
	}
}

/**
 * qns
 * - props passing / referencing
 * - drawing / dirty sections
 * - svg?
 *
 * ideas
 * - parrallel histogram
 * - strip bars
 * - more grids
 * - cursor (crosshair, move? vs pointer, default)
 */