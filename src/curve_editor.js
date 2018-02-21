class GridArea {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.children = [
			new CurveElement(x => x * x),
			new BoxElement(100, 100)
		];
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
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.w = 8;
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
		if (x >= this.x - w2 && x <= this.x + w2 && y >= this.y - w2 && y <= this.y + w2) {
			return true;
		}
		return false;
	}

	mousedown(x, y) {
		this.down = true;

		this.downx = x;
		this.downy = y;
		this.ox = this.x;
		this.oy = this.y;

		const mousemove = (e) => {
			this.x = (e.offsetX - this.downx) + this.ox;
			this.y = (e.offsetY - this.downy) + this.oy;
		}

		const mouseup = () => {
			document.body.removeEventListener('mousemove', mousemove)
			document.body.removeEventListener('mouseup', mouseup)
		}

		document.body.addEventListener('mousemove', mousemove)
		document.body.addEventListener('mouseup', mouseup)
	}

	// isIn(ctx, x, y) {
	// 	this.paint(ctx);
	// 	return ctx.isPointInPath(x, y)
	// }
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
		const fn = x => x * x;
		// ctx.lineWidth = 1;
		// ctx.strokeStyle = '#ddd';
		for (let x = 0; x < this.width; x+=10) {
			ctx.beginPath();
			ctx.moveTo(x, this.height);
			ctx.lineTo(fn(x / this.width) * this.width, 0);
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
			if (this.moo) return
			this.moo = setTimeout(() => {
				this.moo = null;
				this._draw();
			});

			// console.log(e.offsetX, e.offsetY);
			const x = e.offsetX, y = e.offsetY;
			let inside = false;
			this.forIn(this, (child, cx, cy) => {
				if (child.isIn) {
					if (child.isIn(this.ctx, x - cx, y - cy)) {
						inside = true;
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
		el.children.forEach(child => {
			func(child, cx, cy);
			cx += child.x || 0;
			cy += child.y || 0;
			
			this.forIn(child, func, cx, cy);
			
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

		this.gridArea.width = histoWidth;
		this.gridArea.height = histoHeight;

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
 */