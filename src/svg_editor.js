function SvgEditor() {
    var svg = svgEl('svg');

    setAttr(svg, {
        width: 500,
        height: 400
    })

    path = svgEl('path');

    setAttr(path, {
        d: 'M10 10, 20 20, 30 30, 40 40',
        id: 'moo',
        // C 20 20, 40 40, 50 10
        stroke: 'black',
        // fill: 'black'
        'stroke-width': '4'
    })

    circle = svgEl('circle', {
        cx: 25, cy: 25, r: 10, stroke: 'blue'
    })

    path.onmouseover = () => {
        console.log('mouse over!');
    }

    circle.onmousedown = () => {
        const move = (e) => {
            setAttr(circle, { cx: e.offsetX, cy: e.offsetY });
        }

        const up = () => {
            document.body.removeEventListener('mousemove', move)
            document.body.removeEventListener('mouseup', up)
        }

        document.body.addEventListener('mousemove', move)
        document.body.addEventListener('mouseup', up)
    }

    g = svgEl('g', { x: 20, y: 20 })

    nest(
        svg, [
            path,
            circle,
            g
        ]
    )

    return svg;
}

svg = SvgEditor();
nest(document.body, [ svg ]);

function svgEl(element, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', element);
    if (attrs) {
        setAttr(el, attrs);
    }

    return el;
}

function setAttr(node, props) {
    for (var k in props) {
        node.setAttribute(k, props[k]);
    }
}

function nest(node, children) {
    children.forEach(child => node.appendChild(child));

    return node;
}

register({
    notify(type, _points) {
        if (type !== 'POINTS_UPDATED' || !_points) return

        console.log(`Received event [${type}]`, _points)

        ;[...g.children].forEach(child => child.remove());

        circles = _points.map(point => {
            return svgEl('circle', {
                cx: point.x,
                cy: point.y,
                r: 15,
                fill: '#333'
            })
        })

        process_points(_points);

        var size = 300;

        var box = svgEl('rect', {
            x: 0,
            y: 0,
            width: size,
            height: size,
            fill: '#ddd',
            stroke: '#000'
        })


        var p = svgEl('path', {
            d: 'M' + Array(100).fill().map((_, i) => `${i / 99 * size} ${( 1- curve(i / 99))* size}`).join(', '),
            fill: 'transparent',
            stroke: 'purple',
            'stroke-width': 4
        })

        nest(g, [ box, p ])
        nest(g, circles)

    }
})

/**
 * Working in SVG
 *
 * nice
 * - almost like custom elements
 * - dom properties (listeners, nesting etc)
 * - set attributes and forget about them (unlike canvas when you need to render them)
 * - stylable
 *
 * bad
 * - svg quirks, eg. ns (solved with helpers)
 * - should have use it earlier more often!
 *
 * todo
 * - think about bridging gaps of canvas and svg implementations
 * - decouple business logic (eg points contrains) from ui elements
 *
 * V - view objects
 * C - convert V -> M objects
 * M - data
 */