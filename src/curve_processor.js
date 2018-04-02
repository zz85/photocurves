

function setupCurveProcessor() {
	const glProcessor = new WebGL2Processor();

	var vertexShaderSource = `#version 300 es
	// attributes buffer input
	in vec2 a_position;
	in vec2 a_texCoord;

	// globals
	uniform vec2 u_resolution;

	// varyings
	out vec2 v_texCoord;

	void main() {
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
	glProcessor.defineUniform('u_resolution', 'f', glProcessor.canvas.width, glProcessor.canvas.height);
	glProcessor.defineUniform('u_slider', 'f', 0);
	glProcessor.defineUniform('u_curve', 'i', 1); // textures
	glProcessor.defineUniform('u_image', 'i', 0);
	glProcessor.lookupUniforms();

	glProcessor.setupAttributes();

	// Tell the shader to get the texture from texture unit 0

	data = new Float32Array(256 * 1 * 4);

	fillData();
	console.log('data', data.length);

	glProcessor.updateDataTexture('u_curve', data);

	return glProcessor;
}

function fillData() {
	for (var i = 0; i < 256; i++) {
		var t = i / 256;
		t = t * t; // push
		data[i * 4 + 0] = t;
		data[i * 4 + 1] = t;
		data[i * 4 + 2] = t;
		data[i * 4 + 3] = 1;
	}
}

function fillCurveData() {
	for (var i = 0; i < 256; i++) {
		var t = t = curve(i / 256);
		data[i * 4 + 0] = t;
		data[i * 4 + 1] = t;
		data[i * 4 + 2] = t;
		data[i * 4 + 3] = 1;
	}

	glProcessor.updateDataTexture('u_curve', data);
}