var gl;

function init() {
    // follow this! https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');

    if (!gl) {
        console.log('webgl2 not support');
        return;
    }


    var vertexShaderSource = `#version 300 es
 
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;
     
    // all shaders have a main function
    void main() {
      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }    
    `;

    var fragmentShaderSource = `#version 300 es
 
    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default. It means "medium precision"
    precision mediump float;
     
    // we need to declare an output for the fragment shader
    out vec4 outColor;
     
    void main() {
      // Just set the output to a constant redish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
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

    console.log('Failed to compile\n')
    console.log(log);
    var code = source.split('\n').map((line, no) => `${no + 1}: ${line}`).join('\n');
    console.log(code);
}

init();