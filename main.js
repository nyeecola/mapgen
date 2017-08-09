var gl;
var ext;
var shader_program;
var hexes;
var camera;

var array_buffer;
var indices_buffer;

function initGL() {
  var canvas = document.querySelector('#canvas');  
  var gl = canvas.getContext('webgl');
  var width = window.innerWidth;
  var height = window.innerHeight;
  
  canvas.width = width;
  canvas.height = height;
  
  gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0,0,0.6,1);
  
  gl.enable(gl.DEPTH_TEST);
  
  gl.enable(gl.SAMPLE_COVERAGE);
  gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
	gl.sampleCoverage(1, false);
  
  window.addEventListener('resize', function() {
    gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  });
  
  return gl;
}

function draw(dt) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  gl.useProgram(shader_program);
  
  var view = mat4.create();
  view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
  view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));

  // TEST
  camera.y += dt * 0.00001;
  
  var projection = mat4.create();
  projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);

  var uniform_loc;
  uniform_loc = gl.getUniformLocation(shader_program, "view");
  gl.uniformMatrix4fv(uniform_loc, gl.FALSE, view);
  uniform_loc = gl.getUniformLocation(shader_program, "projection");
  gl.uniformMatrix4fv(uniform_loc, gl.FALSE, projection);
  
  var hex_indices = [0, 1, 2, 0, 2, 3, 0, 3, 5, 3, 4, 5];
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hex_indices), gl.STATIC_DRAW);

  // TEST
  var hex = create_hex(0, 0, 0.1);
  var hex_verts = [];
  for (var i = 0; i < 6; i++) {
    hex_verts = hex_verts.concat(hex_corner(hex, i));
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, array_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hex_verts), gl.STATIC_DRAW);

  var vertexLocation = gl.getAttribLocation(shader_program,"position");
  gl.enableVertexAttribArray(vertexLocation);
  gl.vertexAttribPointer(vertexLocation,3,gl.FLOAT,false,6 * 4,0);
    

  var model_loc = gl.getUniformLocation(shader_program, "model");
  var vertexColor = gl.getAttribLocation(shader_program,"color");
  for (let hex of hexes) {
	  // TEST
    //if (Math.abs(camera.x - hex.x) > 20 || Math.abs(camera.y - hex.y) > 20) continue;

    var model = mat4.create();
    model = mat4.translate(model, model, vec3.fromValues(hex.x, hex.y, 0));
    gl.uniformMatrix4fv(model_loc, gl.FALSE, model);

    gl.vertexAttrib3f(vertexColor, hex.r, hex.g, hex.b);
    
    gl.drawElements(gl.TRIANGLES,hex_indices.length,gl.UNSIGNED_SHORT,0);
    
    model = mat4.translate(model, model, vec3.fromValues(0, 0, 0.001));
    gl.uniformMatrix4fv(model_loc, gl.FALSE, model);
    gl.vertexAttrib3f(vertexColor, 0, 0, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, hex_verts.length/2/3);
  }
  
  requestAnimationFrame(draw)
}

function createShaders(gl, type) {
  var shaderScript = '';
  var shader;

  switch(type) {
    case 'fragment':
      shaderScript = document.querySelector('#shader-fs').textContent;
      shader = gl.createShader(gl.FRAGMENT_SHADER);
      break;
    case 'vertex':
      shaderScript = document.querySelector('#shader-vs').textContent;
      shader = gl.createShader(gl.VERTEX_SHADER);
      break;
  }

  gl.shaderSource(shader, shaderScript);
  gl.compileShader(shader);
  console.log(gl.getShaderInfoLog(shader));
  
  return shader;
}

function initShaders(gl) {
  var vertexShader = createShaders(gl, 'vertex');
  var fragmentShader = createShaders(gl, 'fragment');
  
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  console.log(gl.getProgramInfoLog(shaderProgram));
  return shaderProgram;
}

function main() {
  gl = initGL();
  ext = gl.getExtension('ANGLE_instanced_arrays');
  shader_program = initShaders(gl);
  hexes = []
  
  var start_x = 0;
  var radius = 0.1;
  var width = Math.sqrt(3)/2 * radius;
  for (var j = 0; j < 40; j++) {
  	for (var i = 0; i < 40; i++) {
  		var hex = create_hex(i * width + j * width * 2, i * 3/4 * 2 * radius, radius);
      var hex_types = ['grass', 'water'];
      hex_type = hex_types[Math.floor(Math.random()*hex_types.length)]
      if (hex_type === 'grass') {
        hex.r = 0.3;
        hex.g = 0.86;
        hex.b = 0.3;
      }
      else {
      	hex.r = 0.1;
        hex.g = 0.6;
        hex.b = 1;
      }
      hexes.push(hex);
  	}
  }

  for (let hex of hexes) {
    var hex_verts = [];
    for (var i = 0; i < 6; i++) {
      hex_verts = hex_verts.concat(hex_corner(hex, i));
    }
    hex.verts = hex_verts;
  }

  array_buffer = gl.createBuffer();
  indices_buffer = gl.createBuffer();

  camera = create_camera(-6, -2.5, -0.8);

  requestAnimationFrame(draw);
  
  document.onkeypress = function (e) {
    e = e || window.event;
    console.log(camera);
		camera.x += 0.05;
  };
}

function create_camera(x, y, z) {
	return {'x': x, 'y': y, 'z': z};
}

function create_hex(x, y, radius) {
	return {'x': x, 'y': y, 'radius': radius, 'height': radius, 'width': Math.sqrt(3)/2 * radius, 'r': 1, 'g': 1, 'b': 1};
}

function hex_corner(hex, i) {
    var angle_deg = 60 * i   + 30
    var angle_rad = 3.14159 / 180 * angle_deg
    return [hex.x + hex.radius * Math.cos(angle_rad),
            hex.y + hex.radius * Math.sin(angle_rad),
            0,
            hex.r,
            hex.g,
            hex.b];
}

main();

