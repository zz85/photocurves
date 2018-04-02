/**
 * -------
 * Simple generic webgl2 library
 * @author zz85 (https://github.com/zz85 | https://twitter.com/blurspline)
 * --------
 * 
 * Usage
 * ------
 * glProcessor = new WebGL2Processor()
 * // setup
 * 	.compile()
 * 	.defineUniform()
 * 	.lookupUniforms()
 * 	.setupAttributes()
 * 
 * // update
 * 	.updateUniform(name, ...values)
 * 	.updateTexture(name, ...image)
 * 	.draw()
 * 
 * TODOs
 * -----
 * - streamline setting up of uniforms, textures, attributes
 */
class WebGL2Processor {
	constructor() {
		this.uniforms = [];
		this.attributes = [];

		this.init();
	}

	init() {
		var canvas = document.createElement('canvas');
		canvas.width = innerWidth;
		canvas.height = innerHeight;

		var gl = canvas.getContext('webgl2');

		this.canvas = canvas;
		this.gl = gl;

		if (!gl) {
			console.log('webgl2 not support');
			return;
		}
	}

	compile(vertexShaderSource, fragmentShaderSource) {
		var gl = this.gl;
		var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
		var program = createProgram(gl, vertexShader, fragmentShader);

		this.program = program;
		gl.useProgram(program);
	}

	defineUniform(name, type, ...values) {
		this.uniforms.push(this._uniformType(name, type, ...values));
	}

	_uniformType(name, type, ...values) {
		return { name, type: type || 'f', values };
	}

	lookupUniforms() {
		this._uniforms = {};

		var gl = this.gl;
		var program = this.program;

		// lookup uniforms
		this.uniforms.forEach(uniform => {
			var name = uniform.name;
			var location = gl.getUniformLocation(program, name);
			if (location === null) console.warn(`Warning: uniform [${name}] not found in shaders`);

			uniform._location = location;
			this._uniforms[name] = uniform; // cache

			if (uniform.values.length) this.updateUniform(name, ...uniform.values);
		});
	}

	updateUniform(name, ...values) {
		var { _location, type } = this._uniforms[name];
		this._uniforms[name].values = values; // copy values
		var method = `uniform${values.length}${type}`;
		this.gl[method](_location, ...values);
	}

	updateTexture(name, image) {
		var ref = this._uniforms[name];
		if (ref.values[0] !== undefined) ref.i = ref.values[0];
		_updateTexture(this.gl, ref, image);
	}

	updateDataTexture(name, data) {
		var ref = this._uniforms[name];
		if (ref.values[0] !== undefined) ref.i = ref.values[0];
		_updateDataTexture(this.gl, ref, data);
	}

	defineAttribute(name) {
		this.attributes.push({ name, _location });
	}

	setupAttributes() {
		var program = this.program;
		var gl = this.gl;

		// Vertex Array Object (attribute state)
		var vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

		// attribute { name, _buffer, _location, }
		var texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0.0, 0.0,
			1.0, 0.0,
			0.0, 1.0,
			0.0, 1.0,
			1.0, 0.0,
			1.0, 1.0
		]), gl.STATIC_DRAW);
	
		var texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');
		gl.enableVertexAttribArray(texCoordAttributeLocation);
		var size = 2;
		var type = gl.FLOAT;
		var normalize = false;
		var stride = 0;
		var offset = 0;
		gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);

		// buffers to power attributes
		var positionBuffer = gl.createBuffer();
		// bind buffer to attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

		var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
		// we want data out of our buffers
		gl.enableVertexAttribArray(positionAttributeLocation);

		var size = 2; // 2 components per iterations
		var type = gl.FLOAT; // 32 bits
		var normalize = false; // dont normalize data
		var stride = 0; // size * sizeof(type) to get to next
		var offset = 0; //

		gl.vertexAttribPointer(
			positionAttributeLocation, size, type, normalize, stride, offset
		);

		setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);
	}

	draw() {
		var program = this.program;
		var gl = this.gl;
		if (!program) return console.log('no program');
		resize(gl.canvas); // resize canvas
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // set viewport (remap -1..1)

		// clear canvas
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;

		gl.drawArrays(primitiveType, offset, count);
	}
}

function setRectangle(gl, x, y, width, height) {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;

	// NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
	// whatever buffer is bound to the `ARRAY_BUFFER` bind point
	// but so far we only have one buffer. If we had more than one
	// buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		x1, y1,
		x2, y1,
		x1, y2,
		x1, y2,
		x2, y1,
		x2, y2]), gl.STATIC_DRAW);
}

function createShader(gl, type, source) {
	var shader = gl.createShader(type); // create shader
	gl.shaderSource(shader, source); // set source
	gl.compileShader(shader); // compile shader
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	// fail
	var log = gl.getShaderInfoLog(shader);
	gl.deleteShader(shader);

	console.log('Failed to compile')
	console.log(log);
	var code = source.split('\n').map((line, no) => `${no + 1}: ${line}`).join('\n');
	console.log(code);
}

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	var log = gl.getProgramInfoLog(program);
	console.log('Error creating program');
	console.log(log);

	gl.deleteProgram(program);
}

function bindTexture(gl, state) {
	var { i, _texture } = state; // i is texture slot
	if (!_texture) {
		var _texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, _texture);
		state._texture = _texture;
		return;
	}

	gl.activeTexture(gl.TEXTURE0 + i);
}

function _updateTexture(gl, state, image) {
	bindTexture(gl, state);

	// Set the parameters so we don't need mips and so we're not filtering
	// and we don't repeat
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	var mipLevel = 0; // largest mip
	var internalFormat = gl.RGBA;
	var srcFormat = gl.RGBA;
	var srcType = gl.UNSIGNED_BYTE;

	gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat, srcFormat, srcType, image);
}

function _updateDataTexture(gl, state, data) {
	bindTexture(gl, state);

//   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.filter || options.magFilter || gl.LINEAR);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.filter || options.minFilter || gl.LINEAR);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap || options.wrapS || gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap || options.wrapT || gl.CLAMP_TO_EDGE);

	// Set the parameters so we don't need mips and so we're not filtering
	// and we don't repeat
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //  gl.LINEAR gl.NEAREST
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	var target = gl.TEXTURE_2D;
	var mipLevel = 0; // largest mip
	var internalFormat = gl.RGBA32F;
	var srcFormat = gl.RGBA;
	var srcType = gl.FLOAT; // UNSIGNED_BYTE FLOAT
	var border = 0;
	var textureWidth = 256;
	var textureHeight = 1;

	gl.texImage2D(
		target,
		mipLevel,
		internalFormat,
		textureWidth,
		textureHeight,
		border,
		srcFormat,
		srcType,
		data );
}

function resize(canvas) {
	// Lookup the size the browser is displaying the canvas.
	var displayWidth  = canvas.clientWidth;
	var displayHeight = canvas.clientHeight;

	// Check if the canvas is not the same size.
	if (canvas.width  !== displayWidth ||
		canvas.height !== displayHeight) {

		// Make the canvas the same size
		canvas.width  = displayWidth;
		canvas.height = displayHeight;
	}
}