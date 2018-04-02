var gl, program, sliderValue = 0;

class WebGL2Processor {
	constructor() {
		this.uniforms = [];
		this.init();
		// get context
		// compile program
		// attributes
		// uniforms

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
		});
	}

	updateUniform(name, ...values) {
		var { _location, type } = this._uniforms[name];
		var method = `uniform${values.length}${type}`;
		this.gl[method](_location, ...values);
	}

	setupAttributes() {
		var program = this.program;
		var gl = this.gl;
		// attributes
		var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
		var texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');

		// Vertex Array Object (attribute state)
		var vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

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

		setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);

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

	_compile() {


	}
}

function init() {
	// follow this! https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
	// then https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html
	// then https://webgl2fundamentals.org/webgl/lessons/webgl-less-code-more-fun.html

	glProcessor = new WebGL2Processor();
	canvas = glProcessor.canvas;
	gl = glProcessor.gl;

	canvas.onmousemove = (e) => {
		var t = e.offsetX  / canvas.width;
		// console.log(t);

		sliderValue = t;

		drawScene();
	}

	document.body.appendChild(canvas);

	var image = new Image();
	imageTexture = { gl, i: 0, image }
	render();

	image.src = "img/Lenna.png";
	image.onload = function() {
		canvas.width = image.width;
		canvas.height = image.height;

		imageTexture.image = image;
		updateTexture(imageTexture);
		drawScene();
	}
}

function render() {
	var vertexShaderSource = `#version 300 es

	// an attribute is an input (in) to a vertex shader.
	// It will receive data from a buffer
	in vec2 a_position;
	in vec2 a_texCoord;

	// globals
	uniform vec2 u_resolution;

	// varyings
	out vec2 v_texCoord;


	// all shaders have a main function
	void main() {
	  // gl_Position is a special variable a vertex shader
	  // is responsible for setting

	  // convert the position from pixels to 0.0 to 1.0
	  vec2 zeroToOne = a_position / u_resolution;

	  // convert from 0->1 to 0->2
	  vec2 zeroToTwo = zeroToOne * 2.0;

	  // convert from 0->2 to -1->+1 (clipspace)
	  vec2 clipSpace = zeroToTwo - 1.0;

	  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
	  v_texCoord = a_texCoord;
	}
	`;

	var fragmentShaderSource = `#version 300 es
	// fragment shaders don't have a default precision so we need
	// to pick one. mediump is a good default. It means "medium precision"
	precision mediump float;

	// our texture
	uniform sampler2D u_image;
	uniform sampler2D u_curve;
	uniform float u_slider;

	// we need to declare an output for the fragment shader
	out vec4 outColor;

	// the texCoords passed in from the vertex shader.
	in vec2 v_texCoord;

	void main() {
		vec4 source = texture(u_image, v_texCoord);
		float curve = texture(u_curve, vec2(
			(source.x + source.y + source.z) / 3.
				, 0.5)).x;

		// rgba.rgb *= 1. + (u_slider-0.5) * 2.;
		outColor = vec4(vec3(curve), 1.0);
	}
	`;

	glProcessor.compile(vertexShaderSource, fragmentShaderSource);

	// uniforms
	glProcessor.defineUniform('u_resolution');
	glProcessor.defineUniform('u_slider', 'f');
	glProcessor.defineUniform('u_curve', 'i'); // textures
	glProcessor.defineUniform('u_image', 'i');
	glProcessor.lookupUniforms();

	updateUniforms();

	glProcessor.setupAttributes();

	// Tell the shader to get the texture from texture unit 0

	data = new Float32Array(256 * 1 * 4);

	fillData1();
	console.log('data', data.length);

	curveTexture = {
		gl, i: 1, data
	}

	updateDataTexture(curveTexture);

	drawScene();
}

function fillData1() {
	for (var i = 0; i < 256; i++) {
		var t = i / 256;
		t = t * t; // push
		data[i * 4 + 0] = t;
		data[i * 4 + 1] = t;
		data[i * 4 + 2] = t;
		data[i * 4 + 3] = 1;
	}
}

function fillData2() {
	for (var i = 0; i < 256; i++) {
		var t = i / 256;
		t = 1 - (1 - t) * (1 - t); // pull
		data[i * 4 + 0] = t;
		data[i * 4 + 1] = t;
		data[i * 4 + 2] = t;
		data[i * 4 + 3] = 1;
	}
}

function updateUniforms() {
	// update uniforms
	glProcessor.updateUniform('u_resolution', gl.canvas.width, gl.canvas.height);
	glProcessor.updateUniform('u_slider', sliderValue);
	glProcessor.updateUniform('u_image', 0);
	glProcessor.updateUniform('u_curve', 1);
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

function drawScene() {
	glProcessor.draw();
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

function updateTexture(state) {
	var { gl, i, image, texture } = state;
	bindTexture(state);

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

function bindTexture(state) {
	var { gl, i, data, texture } = state;
	if (!texture) {
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		state.texture = texture;
		return;
	}

	gl.activeTexture(gl.TEXTURE0 + i);
}

function updateDataTexture(state) {
	var { gl, i, data, texture } = state;
	bindTexture(state);

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

init();

function brighter() {
	fillData2();
	updateDataTexture(curveTexture);
	drawScene()
}

function darker() {
	fillData1();
	updateDataTexture(curveTexture);
	drawScene()
}