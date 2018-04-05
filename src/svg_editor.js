// TODO: make a full SVG featured for Editor
function SvgEditor() {
    var svg = svgEl('svg');

    setAttr(svg, {
        width: 500,
        height: 400
    })

    g = svgEl('g', { x: 20, y: 20, style: 'padding: 10px;' })

    nest(
        svg, [
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

function attachDrag(node) {
    node.onmousedown = () => {
        const move = (e) => {
            setAttr(node, { cx: e.offsetX, cy: e.offsetY });
            notify('POINTS_UPDATED', circles.map(circle => {
                return {
                    t: +circle.getAttribute('cx') / 300,
                    v: 1 - circle.getAttribute('cy') / 300,
                    x: circle.getAttribute('cx'),
                    y: circle.getAttribute('cy'),
                }
            }))
        }

        const up = () => {
            document.body.removeEventListener('mousemove', move)
            document.body.removeEventListener('mouseup', up)
        }

        document.body.addEventListener('mousemove', move)
        document.body.addEventListener('mouseup', up)
    }
}

register({
    notify(type, _points) {
        if (type !== 'POINTS_UPDATED' || !_points) return
        
        process_points(_points);
        console.log(`Received event [${type}]`, _points)
        updatePoints(_points);
    }
})

function updatePoints(_points) {
    ;[...g.children].forEach(child => child.remove());

    // apply update, add, remove life cycle?
    circles = _points.map(point => {
        return svgEl('circle', {
            cx: point.x,
            cy: point.y,
            r: 15,
            fill: '#333',
            class: 'circle'
        })
    })

    circles.forEach(circle => attachDrag(circle))

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

    p.onmousemove = (e) => {
        console.log('mouse over!', e);
    }

    nest(g, [ box, p ])
    nest(g, circles)
}

// updatePoints([]);

/**
 * Working in SVG
 *
 * nice
 * - almost like custom elements
 * - dom properties (listeners, nesting etc)
 * - set attributes and forget about them (unlike canvas when you need to render them)
 * - easy stylable (via css)
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