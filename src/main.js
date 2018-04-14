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

function makeHeightDraggable(divider, target, order) {
    order = order || 1;
    divider.addEventListener('mousedown', handleHDrag)

    function handleHDrag(event) {
        var constrain = target.clientHeight;
        var y = event.clientY;
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
        event.preventDefault();

        function mousemove(e) {
            updateTarget(constrain + (e.clientY - y) * order);
        }

        function mouseup() {
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup)
        }
    }

    function updateTarget(height) {
        // TODO save to session/localstorage
        target.style.height = height + 'px'
    }
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

setStyle(document.body, {
    background: '#303030',
    padding: 0,
    margin: '0',

})

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

// dom(
// 	[
// 		button,
// 		'br',
// 		editor.canvas,
// 		mapper.canvas,
// 		photo.canvas,
// 		glProcessor.canvas
// 	]
// )


function layout() {
    var vbox = createEl('box', {
        width: '100%',
        height: '100%',
        display: 'flex',
        'flex-direction': 'column',
        background: '#303030',
        border: '1px solid white'
    });

    var top = createEl('box', {
        height: '40px',
        display: 'flex',
        'font-size': '20px',
        color: '#ddd',
        padding: '4px',
        'text-align': 'center',
        background: '#101010'
    });

    top.innerHTML = 'PhotoCurves'

    var hbox = createEl('box', {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#303030',
    });

    var leftPane = createEl('box', {
        width: '250px',
        overflow: 'auto'
        // flex: '1 1',
    });

    var divider = createEl('box', {
        cursor: 'ew-resize',
        width: '5px',
        background: 'white'
    });

    var centerPane = createEl('box', {
        flex: '1 1',
        background: '#ddd',
        overflow: 'auto'
    });

    makeDrag(divider, leftPane);

    var hboxDom = nest(
        hbox, [
            nest(leftPane, [ editor.canvas ]),
            divider,
            nest(centerPane, [ glProcessor.canvas] )
        ]
    )

    var vboxDom = nest(
        vbox, [
            nest(top, [button]),
            hboxDom
        ]
    )

    var ro = new ResizeObserver(els => els.forEach(element => {
        var w = element.contentRect.width;
        editor.setSize(w, w);
        editor._draw();
    }))

    ro.observe(leftPane);

    return vboxDom;
}

var layouted = layout();
dom([ layouted ])
