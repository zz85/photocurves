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
	}

	draw(ctx) {
		const w = 6;
		ctx.lineWidth = 1;
		ctx.fillStyle = '#ddd'
		ctx.strokeStyle = '#fff'
		ctx.strokeRect(-w/2, -w/2, w, w);
	}
}

class CurveElement {
	constructor(equation) {
		this.equation = equation || (x => x);
	}

	draw(ctx, { width, height }) {
		console.log(width, height);
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
			// console.log(e.offsetX, e.offsetY);

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
