class GridArea {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	draw(ctx, histoWidth, histoHeight) {
		ctx.strokeStyle = '#333';

		// draw borders
		ctx.beginPath();
		ctx.rect(0, 0, histoWidth, histoHeight);
		ctx.stroke();
		ctx.fillStyle = '#444';
		ctx.fill();

		const GRIDS = 4;

		// draw v grids
		for (let i = 0; i < GRIDS; i++) {
			ctx.beginPath();
			ctx.moveTo(i * histoWidth / GRIDS, 0);
			ctx.lineTo(i * histoWidth / GRIDS, histoHeight);
			ctx.stroke();
		}

		// draw h grids
		for (let i = 0; i < GRIDS; i++) {
			ctx.beginPath();
			ctx.moveTo(0, i * histoHeight / GRIDS);
			ctx.lineTo(histoWidth, i * histoHeight / GRIDS);
			ctx.stroke();
		}
	}
}

class CurveElement {
	constructor(equation) {
		this.equation = equation || (x => y);
	}

	draw(ctx, histoWidth, histoHeight) {
		const eq = this.equation;

		let t = 0;
		let y = eq(t);
		ctx.beginPath();
		ctx.moveTo(0, (1 - y) * histoHeight);

		for (let x = 1; x <= histoWidth; x++) {
			t = x / histoWidth;
			ctx.lineTo(x, (1 - y) * histoHeight)
		}
		ctx.stroke();
	}
}

class Editor {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		const canvas = document.createElement('canvas');

		this.ctx = canvas.getContext('2d');
		this.canvas = canvas;

		canvas.addEventListener('mousemove', (e) => {
			// console.log(e.offsetX, e.offsetY);
		})

		this.area = new GridArea();
		
		this.resize();
		this.draw();
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

	draw() {
		const { ctx, dpr, width, height } = this;
		ctx.save();
		ctx.scale(dpr, dpr);

		ctx.fillStyle = '#555'
		ctx.fillRect(0, 0, width, height);

		var padding = 40;
		var stripWidth =  10;
		var histoWidth = width - padding * 2;
		var histoHeight = height - padding * 2;

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
		// ctx.stroke();

		ctx.save();
		ctx.translate(padding, padding);
		this.area.draw(ctx, histoWidth, histoHeight);
		ctx.restore();

		ctx.restore();
	}
}
