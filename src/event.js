/**
 * Simple Event / Data management
 * 
 * - Send message
 *     .notify(action, ...opts)
 * 
 * - Receive message
 *     object.notify = (action, ...opts)
 *     .register(object)
 */

const notify = (action, ...params) => {
	listeners.forEach(listener => {
		listener.notify && listener.notify(action, ...params);
	})
}
const listeners = new Set;

const register = (target) => {
	listeners.add(target);
}

/**
 * Super simple DOM management
 */
const dom = (children) => {
	children = Array.isArray(children) ? children : [ children ];
	children.forEach(c => {
		if (typeof c === 'string') {
			c = document.createElement(c);
		}

		document.body.appendChild(c);
	})
};

function nest(node, children) {
    children.forEach(child => node.appendChild(child));

    return node;
}