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

function create_hexes_instance_arrays(hexes)
{
	hexes_instance_arrays = {};

	for (let hex of hexes) {
		if(!hexes_instance_arrays.hasOwnProperty(hex.type))
		{
			hexes_instance_arrays[hex.type] = [];
		}
		hexes_instance_arrays[hex.type] = hexes_instance_arrays[hex.type].concat([hex.x, hex.y, 0, hex_types[hex.type][0], hex_types[hex.type][1], hex_types[hex.type][2]]);
	}

	for (let array in hexes_instance_arrays)
	{
		hexes_instance_arrays[array] = new Float32Array(hexes_instance_arrays[array]);
	}

	return hexes_instance_arrays;
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

