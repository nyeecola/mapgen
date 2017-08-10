// TODO
//
// Features:
// add texture support
// add mesh support
// add font/text support
// add fallback to computers without instancing available
// add wrap around left/right
// create/improve map gen algorithms
// create loading screen
//
// Maintenance:
// refactor rendering code
// refactor code into multiple files
// start using static analysis since JS is bad
// maybe rename some usage of hex to tile?
// refactor classes
//
// Performance:
// improve ray to hexagon intersection test

// constants
var radius = 0.1;
var columns = 140;
var rows = 90;

// almost never changing state
var gl;
var canvas;

// opengl state
var ext;
var shader_program;
var array_buffer;
var indices_buffer;
var instance_buffer;
var instance_array_of_hexes;

// engine state
var last_time = 0;
var key_state = [];
var hexes;
var camera;
var sea_level = 0;
var max_elevations = 3;

// NOTE: in progress
var hex_types = {
	'grassland': [0.3, 0.9, 0.3],
	'forest': [0.0, 0.7, 0.0],
	'desert': [1, 1, 0.6],
	'sea': [0.3, 0.62, 1.0],
	'ocean': [0.2, 0.4, 1],
	'mountain': [0.7, 0.7, 0.7],
	'ice': [0.5, 0.9, 1]
};

function initGL() {
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

function draw(time)
{
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
	var hex_verts = hex_corners(0, 0, 0.1);

	gl.bindBuffer(gl.ARRAY_BUFFER, array_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hex_verts), gl.STATIC_DRAW);

	var vertexLocation = gl.getAttribLocation(shader_program,"position");
	gl.enableVertexAttribArray(vertexLocation);
	gl.vertexAttribPointer(vertexLocation,3,gl.FLOAT,gl.FALSE,3 * 4,0);

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
		}*/
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
		ext.drawArraysInstancedANGLE(gl.LINE_LOOP, 0, hex_verts.length/3, hexes.length);
	}

	requestAnimationFrame(draw)
}

function createShaders(gl, type)
{
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

function initShaders(gl)
{
	var vertexShader = createShaders(gl, 'vertex');
	var fragmentShader = createShaders(gl, 'fragment');

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	console.log(gl.getProgramInfoLog(shaderProgram));
	return shaderProgram;
}

function main()
{
	gl = initGL();
	ext = gl.getExtension('ANGLE_instanced_arrays');
	shader_program = initShaders(gl);
	hexes = []

	// choose elevation position
	//var num_elevations = 1 + Math.floor(Math.random() * max_elevations);
	var num_elevations = 2;
	var elevations = [];
	
	for (var i = 0; i < num_elevations; i++)
	{
		elevations.push([]);
		elevations[i].push(Math.floor(columns / num_elevations * i + columns / num_elevations / 2));
		elevations[i].push(Math.floor(rows / 2));
	}

	var start_x = 0;
	var width = Math.sqrt(3)/2 * radius;
	for (var j = 0; j < columns; j++) {
		for (var i = 0; i < rows; i++) {
			var hex = create_hex(i * width + j * width * 2, i * 3/4 * 2 * radius, j, i);

			var dist = columns + rows;
			hex.elevation = dist * num_elevations;
			for (var k = 0; k < num_elevations; k++)
			{
				var cur_dist = hex_distance_points(j, i, elevations[k][0], elevations[k][1]);
				dist = Math.min(dist, cur_dist);
				hex.elevation -= cur_dist;
			}

			//hex.elevation = columns + rows - dist;
			hex.elevation /= (columns + rows) * num_elevations;
			hex.elevation -= 8.0/10;


			var random_factor = Math.random() * 0.014;
			random_factor -= 0.014 / 2;
			hex.elevation += random_factor;

			hex.elevation += perlin(j / 9.5, i / 9.5) * 0.26;

			var types = Object.keys(hex_types);

			// top and bottom
			if (hex.grid_y < 0.1 * rows || hex.grid_y > 0.9 * rows)
			{
				hex.elevation -= 0.055;
				types.splice(types.indexOf('sea'), 1);
				//types.splice(types.indexOf('grassland'), 1);
				//types.splice(types.indexOf('desert'), 1);
				//types.splice(types.indexOf('mountain'), 1);
				//types.splice(types.indexOf('forest'), 1);
			}
			else
			{
				types.splice(types.indexOf('ice'), 1);
			}

			if (hex.elevation > sea_level)
			{
				types.splice(types.indexOf('ocean'), 1);
				types.splice(types.indexOf('sea'), 1);

				// TEST
				if (hex.elevation > 0.10)
				{
					types.splice(types.indexOf('grassland'), 1);
					types.splice(types.indexOf('desert'), 1);
				}
				else
				{
					types.splice(types.indexOf('mountain'), 1);
					if (hex.elevation > 0.04)
					{
						types.splice(types.indexOf('desert'), 1);
					}
				}
			}
			else if (hex.elevation <= sea_level)
			{
				types.splice(types.indexOf('forest'), 1);
				types.splice(types.indexOf('grassland'), 1);
				types.splice(types.indexOf('desert'), 1);
				types.splice(types.indexOf('mountain'), 1);

				if (hex.elevation < -0.02)
				{
					// TODO: use this everywhere
					if (types.indexOf('sea') > -1)
					{
						types.splice(types.indexOf('sea'), 1);
					}
				}
				else if (types.indexOf('ocean') > -1 && types.indexOf('ice') > -1)
				{
					types.splice(types.indexOf('ocean'), 1);
				}
			}
			hex.type = types[Math.floor(Math.random()*types.length)]
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

function create_camera(x, y, z)
{
	return {'x': x,
		'y': y,
		'z': z,
		'speed': 0.004};
}

function create_hex(x, y, grid_x, grid_y, elevation)
{
	return {'x': x,
		'y': y,
		'grid_x': grid_x,
		'grid_y': grid_y,
		'height': radius,
		'width': Math.sqrt(3)/2 * radius,
		'type': null, // should call change_tile_type() to change
		'elevation': null}; // should not be changed after creation (for now)
}

function hex_corners(x, y)
{
	var angle_deg;
	var angle_rad;

	var hex_verts = [];
	for (var i = 0; i < 6; i++)
	{
		angle_deg = 60 * i   + 30;
		angle_rad = Math.PI / 180 * angle_deg;
		hex_verts = hex_verts.concat([x + radius * Math.cos(angle_rad), y + radius * Math.sin(angle_rad), 0]);
	}
	return hex_verts;
}

function create_hexes_instance_array(hexes)
{
	hexes_instance_array = [];

	for (let hex of hexes) {
		hexes_instance_array = hexes_instance_array.concat([hex.x, hex.y, 0, hex_types[hex.type][0], hex_types[hex.type][1], hex_types[hex.type][2]]);
	}

	return new Float32Array(hexes_instance_array);
}

function get_hex_at(x, y)
{
	return hexes[x * rows + y];
}

// NOTE: dirty hack for now, we probably won't even need to change colors later, so leave it as is for a while
function change_hex_type(hex, type)
{
	hex.type = type;
	instance_array_of_hexes[(hex.grid_x * rows + hex.grid_y) * 6 + 3] = hex_types[hex.type][0];
	instance_array_of_hexes[(hex.grid_x * rows + hex.grid_y) * 6 + 4] = hex_types[hex.type][1];
	instance_array_of_hexes[(hex.grid_x * rows + hex.grid_y) * 6 + 5] = hex_types[hex.type][2];
}

function hex_distance(a, b)
{
	return hex_distance_points(a.grid_x, a.grid_y, b.grid_x, b.grid_y);
}

function hex_distance_points(ax, ay, bx, by)
{
	return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(ax + ay - bx - by));
}

window.onkeyup = function(e) {key_state[e.key]=false;}
window.onkeydown = function(e) {key_state[e.key]=true;}

// TODO: handle this inside update? (since I'm using matrixes)
document.addEventListener("click", function(){
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX - rect.left;
	var mouse_y = event.clientY - rect.top;

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

	// TODO
	//if (vec3.dot(ray_world, normal) == ) handle this being null (does not intersect)

	var t = - (vec3.dot(camera_origin, normal) + 0) / divisor;

	// otherwise intersected behind the view
	if (t >= 0) 
	{
		var click_loc = vec3.add(camera_origin, camera_origin, vec3.scale(ray_world, ray_world, t));

		for (var i = 0; i < hexes.length; i++)
		{
			var hex = hexes[i];
			if (Math.pow((hex.x - click_loc[0]), 2) + Math.pow((hex.y - click_loc[1]), 2) < Math.pow(radius, 2))
			{
				var types = Object.keys(hex_types);
				types.splice(types.indexOf(hex.type), 1);
				var type = types[Math.floor(Math.random()*types.length)]
				change_hex_type(hex, type);
			}
		}
	}
});

var gradient = [];
for (var i = 0; i < rows * 3 + 1; i++)
{
	gradient.push([]);
	for (var j = 0; j < columns * 3 + 1; j++)
	{
		gradient[i].push([Math.random(), Math.random() * -1]);
	}
}

function lerp(a, b, w)
{
	return (1.0 - w)*a + w*b;
}

function dot_grid_gradient(ix, iy, x, y)
{
	var dx = x - ix;
	var dy = y - iy;

	return (dx*gradient[iy][ix][0] + dy*gradient[iy][ix][1]);
}

function perlin(x, y)
{
	var x0 = Math.floor(x);
	var x1 = x0 + 1;
	var y0 = Math.floor(y);
	var y1 = y0 + 1;

	var sx = x - x0;
	var sy = y - y0;

	var n0, n1, ix0, ix1, value;
	n0 = dot_grid_gradient(x0, y0, x, y);
	n1 = dot_grid_gradient(x1, y0, x, y);
	ix0 = lerp(n0, n1, sx);
	n0 = dot_grid_gradient(x0, y1, x, y);
	n1 = dot_grid_gradient(x1, y1, x, y);
	ix1 = lerp(n0, n1, sx);
	value = lerp(ix0, ix1, sy);

	return value;
}

main();


