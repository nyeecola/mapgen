// TODO
//
// Features:
// add font/text support
// create loading screen
// add fog of war
// add lightning/shadowing
// add mouse-controlled camera movement (plus zoom)
// add wrap-around left/right (efficiently)
// create more map gen algorithms
// add multiple-sprite tile animation
// add fallback to GPUs without ANGLE_instace_arrays
// lerp between tiles
//
// Maintenance:
// start using static analysis since JS is bad
// maybe rename some usage of hex to tile?
// maybe refactor classes
// rework mouse click handler function
// start using VAOs
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
var tex_coords_buffer;

// engine state

// TODO: create an object to hold textures/meshes
var mountain_model_texture;
var global_mesh_data

var hexes;
var instance_arrays_of_hexes;
var last_time = 0;
var key_state = [];
var camera;
var sea_level = 0;
var max_elevations = 3;
var grid_mode = false;
var offset_tex_animation = 0;
var monkey_object;

// NOTE: in progress
var hex_types = {
	'grassland': [0.3, 0.9, 0.3, null],
	'forest': [0.0, 0.7, 0.0, null],
	'desert': [1, 1, 0.6, null],
	'sea': [0.3, 0.62, 1.0, null],
	'ocean': [0.2, 0.4, 1, null],
	'mountain': [0.7, 0.7, 0.7, null],
	'ice': [0.5, 0.9, 1, null]
};

function create_camera(x, y, z)
{
	return {'x': x,
		'y': y,
		'z': z,
		'speed': 0.004};
}

window.onkeyup = function(e) {
	key_state[e.key]=false;
}
window.onkeydown = function(e) {
	key_state[e.key]=true;

	if (e.key == 'g') grid_mode = !grid_mode;
}

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
				break;
			}
		}
	}
});

