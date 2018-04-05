function SvgEditor() {
    var svg = createEl('svg');

    setAttr(svg, {
        width: 200,
        height: 200
    })

    path = createEl('path');

    setAttr(path, {
        d: 'M10 10, 20 20, 30 30, 40 40',
        id: 'moo',
        // C 20 20, 40 40, 50 10
        stroke: 'black',
        // fill: 'black'
        'stroke-width': '4'
    })

    circle = createEl('circle')

    path.onmouseover = () => {
        console.log('mouse over!');
    }

    nest(
        svg, [
            path
        ]
    )

    return svg;
}

svg = SvgEditor();
nest(document.body, [ svg ]);

function createEl(element) {
    return document.createElementNS('http://www.w3.org/2000/svg', element);
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