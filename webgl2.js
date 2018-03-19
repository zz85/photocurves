var gl, program, vao;

function init() {
    // follow this! https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
    var canvas = document.createElement('canvas');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

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

    program = createProgram(gl, vertexShader, fragmentShader);
    
    // attributes
    var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');

    // buffers to power attributes
    var positionBuffer = gl.createBuffer();
    
    // bind buffer to attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // fill buffers
    var positions = [
        0, 0,
        0, 0.5,
        0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Vertex Array Object (attribute state)
    vao = gl.createVertexArray();
    
    gl.bindVertexArray(vao);
    
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
    

    drawScene();
}

function drawScene() {
    resize(gl.canvas); // resize canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // set viewport (remap -1..1)
    
    // clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // tell webgl which program to use
    gl.useProgram(program);

    // bind the attributes
    gl.bindVertexArray(vao);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;

    gl.drawArrays(primitiveType, offset, count);
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