var glProcessor, program, sliderValue = 0;

function init() {
	// follow this! https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
	// then https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html
	// then https://webgl2fundamentals.org/webgl/lessons/webgl-less-code-more-fun.html

	glProcessor = new WebGL2Processor();
	canvas = glProcessor.canvas;

	canvas.onmousemove = (e) => {
		var t = e.offsetX  / canvas.width;
		// console.log(t);

		sliderValue = t;

		drawScene();
	}

	document.body.appendChild(canvas);

	var image = new Image();
	render();

	image.src = "img/Lenna.png";
	image.onload = function() {
		canvas.width = image.width;
		canvas.height = image.height;

		glProcessor.updateTexture('u_image', image);
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

	glProcessor.updateDataTexture('u_curve', data);

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
	glProcessor.updateUniform('u_resolution', glProcessor.canvas.width, glProcessor.canvas.height);
	glProcessor.updateUniform('u_slider', sliderValue);
	glProcessor.updateUniform('u_image', 0);
	glProcessor.updateUniform('u_curve', 1);
}


function drawScene() {
	glProcessor.draw();
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