var gl, program, vao, resolutionUniformLocation;

function init() {
    // follow this! https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
    // then https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html

    var canvas = document.createElement('canvas');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');

    if (!gl) {
        console.log('webgl2 not support');
        return;
    }

    var image = new Image();
    image.src = "img/Lenna.png";
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        render(image);
    }
}

function render(image) {
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

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    // the texCoords passed in from the vertex shader.
    in vec2 v_texCoord;
     
    void main() {
      // Just set the output to a constant redish-purple
    //   outColor = vec4(1, 0, 0.5, 1);
        vec4 rgba = texture(u_image, v_texCoord);
        // rgba.x = rgba.x * rgba.x;
        // rgba.y = 1. - (1. - rgba.y) * (1. - rgba.y);
        // rgba.z = rgba.z * rgba.z;
        outColor = rgba;
    }
    `;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    program = createProgram(gl, vertexShader, fragmentShader);
    
    // attributes
    var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    var texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');

    // lookup uniforms
    resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    imageLocation = gl.getUniformLocation(program, 'u_image');

    // Vertex Array Object (attribute state)
    vao = gl.createVertexArray();
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

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 0);
    console.log('gl.TEXTURE0 + 0', gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

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
    gl.useProgram(program);

    // 2d
     // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(imageLocation, 0);

    console.log('imageLocation', imageLocation);

    // buffers to power attributes
    var positionBuffer = gl.createBuffer();
    
    // bind buffer to attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // fill buffers
    // var positions = [
    //     0, 0,
    //     0, 0.8,
    //     0.7, 0,

    //     0, 0,
    //     1.0, 1,
    //     0, 1,
    // ];
    
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
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


    drawScene();
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
    resize(gl.canvas); // resize canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // set viewport (remap -1..1)
    
    // clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // tell webgl which program to use
    gl.useProgram(program);

    // bind the attributes
    gl.bindVertexArray(vao); // again!?

    console.log('resolutionUniformLocation', resolutionUniformLocation);
    // gl.uniform2f(resolutionUniformLocation, 1.5, 1.5);
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;

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