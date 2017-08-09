var gl;
var canvas;
var ext;
var shader_program;
var hexes;
var camera;
var key_state = [];

var instance_array_of_hexes;

var array_buffer;
var indices_buffer;
var instance_buffer;

var last_time = 0;

// TEST
//var point = [0, 0, 0.002];

function initGL() {
	//var canvas = document.querySelector('#canvas');  
	canvas = document.getElementById('canvas');
	
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

function draw(time) {

	dt = time - last_time;
	last_time = time;
	if (dt < 0) dt = 0.0000001;

	// TODO: create update function
	if ('ArrowRight' in key_state && key_state['ArrowRight'])
		camera.x -= dt * camera.speed;
	if ('ArrowLeft' in key_state && key_state['ArrowLeft'])
		camera.x += dt * camera.speed;
	if ('ArrowUp' in key_state && key_state['ArrowUp'])
		camera.y -= dt * camera.speed;
	if ('ArrowDown' in key_state && key_state['ArrowDown'])
		camera.y += dt * camera.speed;

	// render frame
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(shader_program);

	var view = mat4.create();
	view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
	view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));

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

	// TODO: make this more readable, also it is way overcomplicated
	var hex = create_hex(0, 0);
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
	var model = mat4.create();
	gl.uniformMatrix4fv(model_loc, gl.FALSE, model);

	if (!ext) {
		// TODO
		/*

    var model_loc = gl.getUniformLocation(shader_program, "model");
    var vertexColor = gl.getAttribLocation(shader_program, "color");
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

*/
    }
	else {

		gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffer);

		var model_pos_loc = gl.getAttribLocation(shader_program, "model_position");
		gl.enableVertexAttribArray(model_pos_loc);
		gl.vertexAttribPointer(model_pos_loc, 3, gl.FLOAT, gl.FALSE, 6 * 4, 0);
		ext.vertexAttribDivisorANGLE(model_pos_loc, 1);

		var color_loc = gl.getAttribLocation(shader_program, "color");
		gl.enableVertexAttribArray(color_loc);
		gl.vertexAttribPointer(color_loc, 3, gl.FLOAT, gl.FALSE, 6 * 4, 3 * 4);
		ext.vertexAttribDivisorANGLE(color_loc, 1);

		// upload data
		gl.bufferData(gl.ARRAY_BUFFER, instance_array_of_hexes, gl.STATIC_DRAW);

		// draw tiles
		ext.drawElementsInstancedANGLE(gl.TRIANGLES, hex_indices.length, gl.UNSIGNED_SHORT, 0, hexes.length);

		// draw outline
		var model = mat4.create();
		model = mat4.translate(model, model, vec3.fromValues(0, 0, 0.001));
		gl.uniformMatrix4fv(model_loc, gl.FALSE, model);

		gl.disableVertexAttribArray(color_loc);
		gl.vertexAttrib3f(color_loc, 0, 0, 0);
		ext.drawArraysInstancedANGLE(gl.LINE_LOOP, 0, hex_verts.length/2/3, hexes.length);



		// TEST
		/*
		gl.disableVertexAttribArray(model_pos_loc);
		gl.vertexAttrib3f(model_pos_loc, 0, 0, 0);
		gl.vertexAttrib3f(color_loc, 1, 1, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, array_buffer);
		console.log('point is ' + point);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);

		vertexLocation = gl.getAttribLocation(shader_program,"position");
		gl.enableVertexAttribArray(vertexLocation);
		gl.vertexAttribPointer(vertexLocation,3,gl.FLOAT,gl.FALSE,0,0);

		gl.drawArrays(gl.POINTS, 0, 1);
		*/
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
	var radius = 0.1; // this code shouldn't be necessary
	var width = Math.sqrt(3)/2 * radius;
	var columns = 140;
	var rows = 100;
	for (var j = 0; j < columns; j++) {
		for (var i = 0; i < rows; i++) {
			var hex = create_hex(i * width + j * width * 2, i * 3/4 * 2 * radius);
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

	array_buffer = gl.createBuffer();
	indices_buffer = gl.createBuffer();
	instance_buffer = gl.createBuffer();

	camera = create_camera(-6, -2.5, -2.8);

	instance_array_of_hexes = create_hexes_instance_array(hexes);

	requestAnimationFrame(draw);
}

function create_camera(x, y, z) {
	return {'x': x, 'y': y, 'z': z, 'speed': 0.004};
}

function create_hex(x, y, radius) {
	return {'x': x, 'y': y, 'radius': radius || 0.1, 'height': radius, 'width': Math.sqrt(3)/2 * radius, 'r': 1, 'g': 1, 'b': 1};
}

function hex_corner(hex, i) {
	var angle_deg = 60 * i   + 30
	var angle_rad = Math.PI / 180 * angle_deg
	return [hex.x + hex.radius * Math.cos(angle_rad),
		hex.y + hex.radius * Math.sin(angle_rad),
		0,
		hex.r,
		hex.g,
		hex.b];
}

function create_hexes_instance_array(hexes) {
	hexes_instance_array = [];

	for (let hex of hexes) {
		hexes_instance_array = hexes_instance_array.concat([hex.x, hex.y, 0, hex.r, hex.g, hex.b]);
	}

	return new Float32Array(hexes_instance_array);
}

function get_hex_at(x, y) {
	return hexes[column * rows + row];
}

window.onkeyup = function(e) {key_state[e.key]=false;}
window.onkeydown = function(e) {key_state[e.key]=true;}

// TODO: handle this inside update? (since I'm using matrixes)
document.addEventListener("click", function(){
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX - rect.left;
	var mouse_y = event.clientY - rect.top;
	//console.log("x: " + mouse_x + " y: " + mouse_y);

	var x = (2.0 * mouse_x) / canvas.width - 1.0;
	var y = 1.0 - (2.0 * mouse_y) / canvas.height;
	var z = 1.0;
	var ray_nds = {'x': x, 'y': y, 'z': z};

	var ray_clip = vec4.fromValues(ray_nds.x, ray_nds.y, -1.0, 1.0);
	
	// TODO: stop rewriting this
	var projection = mat4.create();
	projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
	projection = mat4.invert(projection, projection);
	
	var ray_view = vec4.transformMat4(ray_clip, ray_clip, projection);
	ray_view = vec4.fromValues(ray_view[0], ray_view[1], -1.0, 0.0);

	// TODO: stop rewriting this
	var view = mat4.create();
	view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
	view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));
	view = mat4.invert(view, view);

	var temp = vec4.fromValues(0, 0, 0, 0);
	temp = vec4.transformMat4(temp, ray_view, view);
	var ray_world = vec3.fromValues(temp[0], temp[1], temp[2]);
	ray_world = vec3.normalize(ray_world, ray_world);



	var normal = vec3.fromValues(0, 0, 1);
	var camera_origin = vec3.fromValues(-camera.x, -camera.y, -camera.z);

	var divisor = vec3.dot(ray_world, normal);
	//if (vec3.dot(ray_world, normal) == ) handle this being null (does not intersect)
	

	var t = - (vec3.dot(camera_origin, normal) + 0) / divisor;

	var click_loc = vec3.add(camera_origin, camera_origin, vec3.scale(ray_world, ray_world, t));

	for (var i = 0; i < hexes.length; i++)
	{
		var hex = hexes[i];
		if (Math.pow((hex.x - click_loc[0]), 2) + Math.pow((hex.y - click_loc[1]), 2) < Math.pow(hex.radius, 2))
		{
			hex.r = 1;
			hex.g = 0;
			hex.b = 0;

			// NOTE: dirty hack for now, we probably won't even need to change colors later, so leave it as is for a while
			//instance_array_of_hexes = create_hexes_instance_array(hexes);
			instance_array_of_hexes[i * 6 + 3] = 1;
			instance_array_of_hexes[i * 6 + 4] = 0;
			instance_array_of_hexes[i * 6 + 5] = 0;
		}
	}

	// TODO: continue from here
	// should stop using the circle's equation and stop checking every single hexagon
});

main();
