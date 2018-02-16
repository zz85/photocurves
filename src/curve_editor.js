function editor(width, height) {
	var canvas = document.createElement('canvas');
	var dpr;
	var ctx = canvas.getContext('2d');

	function resize() {
		dpr = window.devicePixelRatio;
		canvas.width = dpr * width;
		canvas.height = dpr * height;

		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		canvas.style.border = '1px solid #ccc'
	}

	function draw() {
		ctx.save();
		ctx.scale(dpr, dpr);

		ctx.fillStyle = '#555'
		ctx.fillRect(0, 0, width, height);
		var padding = 40;
		var histoWidth = width - padding * 2;
		var histoHeight = height - padding * 2;

		// draw gradient strip
		var gradient = ctx.createLinearGradient(0, histoHeight + padding, 0, padding - 10);
		gradient.addColorStop(0, '#000');
		gradient.addColorStop(1, '#fff');
		ctx.fillStyle = gradient;
		ctx.beginPath()
		ctx.rect(padding - 10, padding, 10, histoHeight);
		ctx.fill();
		// ctx.stroke();

		var gradient = ctx.createLinearGradient(0, padding, histoWidth, 0);
		gradient.addColorStop(0, '#000');
		gradient.addColorStop(1, '#fff');
		ctx.fillStyle = gradient;
		ctx.beginPath()
		ctx.rect(padding, padding + histoHeight, histoWidth, 10);
		ctx.fill();
		// ctx.stroke();

		ctx.strokeStyle = '#333';

		// draw borders
		ctx.beginPath();
		ctx.rect(padding, padding, histoWidth, histoHeight);
		ctx.stroke();
		ctx.fillStyle = '#444';
		ctx.fill();

		// draw v grids
		for (let i = 0; i < 4; i++) {
			ctx.beginPath();
			ctx.moveTo(padding + i * histoWidth / 4, padding);
			ctx.lineTo(padding + i * histoWidth / 4, padding + histoHeight);
			ctx.stroke();
		}

		// draw h grids
		for (let i = 0; i < 4; i++) {
			ctx.beginPath();
			ctx.moveTo(padding, padding + i * histoHeight / 4);
			ctx.lineTo(padding + histoWidth, padding + i * histoHeight / 4);
			ctx.stroke();
		}

		ctx.restore();
	}

	resize();
	draw();

	return canvas;
}