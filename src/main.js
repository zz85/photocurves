function makeDrag(divider, target, order) {
    order = order || 1;
    divider.addEventListener('mousedown', handleHDrag)

    function handleHDrag(event) {
        var constrain = target.clientWidth;
        var x = event.clientX;
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
        event.preventDefault();

        function mousemove(e) {
            updateTarget(constrain + (e.clientX - x) * order);
        }

        function mouseup() {
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup)
        }
    }

    function updateTarget(width) {
        // TODO save to session/localstorage
        target.style.width = width + 'px'
    }
}

function layout() {
    var el = createEl('box', {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#303030'
    });

    var leftPane = createEl('box', {
        width: '250px',
        // flex: '1 1',
        border: '1px solid white'
    });

    var divider = createEl('box', {
        cursor: 'ew-resize',
        width: '5px',
        background: 'white'
    });

    var centerPane = createEl('box', {
        flex: '1 1',
        background: '#ddd'
    });

    var rightDivider = createEl('box', {
        cursor: 'ew-resize',
        width: '5px',
        background: 'white'
    });

    var rightPane = createEl('box', {
        width: '300px',
        background: 'orange'
    })

    makeDrag(divider, leftPane);
    makeDrag(rightDivider, rightPane, -1);

    return nest(
        el, [
            leftPane,
            divider,
            centerPane,

            rightDivider,
            rightPane
        ]
    );
}


function createEl(element, style) {
    var el = document.createElement(element);
    if (style) {
        setStyle(el, style);
    }

    return el;
}

function setStyle(node, props) {
    for (var k in props) {
        node.style[k] = props[k];
    }
}

var layouted = layout();
dom([ layouted ])

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