/**
	Events
		POINTS_MOVING: from Box
		POINTS_STOPPED: from Box
		POINTS_UPDATED(points): from Grid, from Box(removal) to redraw
		REDRAW - trigger rerender (not used)
*/
let editor, mapper, photo;

const glProcessor = setupCurveProcessor();

// global listeneer
register({
	notify(type, _points) {
		if (type === 'REDRAW') {
			console.log('zzzz')
			photo && photo._draw();
			return
		}
		if (type !== 'POINTS_UPDATED' || !_points) return

		console.log(`Received event [${type}]`, points)
		process_points(_points);
		
		editor && editor._draw()
		mapper && mapper._draw()
		photo && photo._draw();

		fillCurveData()
		glProcessor.draw();
		// TODO save / export points
	}
})
	
editor = new CanvasElement(
	380, 380,
	new Editor(380, 380)
);

mapper = new CanvasElement(60, 380,
	new MapElement(60, 380));

const img = 
	'img/Lenna.png'
	// 'https://mdn.mozillademos.org/files/5397/rhino.jpg'
	// 'img/rhino.jpg'
	// 'img/climbing.jpg'

photo_holder = new ImageElement(img)

photo = new CanvasElement(
	700, 880,
	photo_holder
);

const open_callback = (result) => {
	// photo_holder.load(result);

	imageToData(result, (data, img) => {
		// console.log('data---', data);
		glProcessor.updateTexture('u_image', img);
		glProcessor.canvas.width = img.width;
		glProcessor.canvas.height = img.height;
		glProcessor.draw();
	})
}
const open_input = opener(open_callback);

const button = add_opener(open_callback);
// photo_holder.load.bind(photo_holder)
// handle_drop(document.body, photo_holder.load.bind(photo_holder))
// document.body.appendChild(open_input);

dom(
	[
		button,
		'br',
		editor.canvas,
		mapper.canvas,
		photo.canvas,
		glProcessor.canvas
	]
)