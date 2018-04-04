

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
	precision highp float;

	// our texture
	uniform sampler2D u_image;
	uniform sampler2D u_curve;
	uniform float u_slider;

	// we need to declare an output for the fragment shader
	out vec4 outColor;

	// the texCoords passed in from the vertex shader.
	in vec2 v_texCoord;

	float curve_map(float value, int channel) {
		return texture(u_curve, vec2(value, 0.5))[channel];
	}

	float curve_map(float value) {
		return curve_map(value, 0);
	}

	void main() {
		vec4 source = texture(u_image, v_texCoord);
		// float lum = (source.x + source.y + source.z) / 3.;
		vec3 curved = vec3(
			curve_map(source.r),
			curve_map(source.g),
			curve_map(source.b)
		);

		// rgba.rgb *= 1. + (u_slider-0.5) * 2.;
		outColor = vec4(curved, source.a);

		// debugging
		// outColor = vec4(source.rgb, source.a);
		// outColor = texture(u_curve, v_texCoord);
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
		var t = i / 255;
		t = t * t; // push
		data[i * 4 + 0] = t;
		data[i * 4 + 1] = t;
		data[i * 4 + 2] = t;
		data[i * 4 + 3] = 1;
	}
}

function fillCurveData() {
	for (var i = 0; i < 256; i++) {
		var t = t = curve(i / 255);
		data[i * 4 + 0] = t;
		data[i * 4 + 1] = t;
		data[i * 4 + 2] = t;
		data[i * 4 + 3] = 1;
	}

	glProcessor.updateDataTexture('u_curve', data);
}