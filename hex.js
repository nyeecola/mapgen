function create_hex(x, y, grid_x, grid_y, elevation)
{
	return {'x': x,
		'y': y,
		'grid_x': grid_x,
		'grid_y': grid_y,
		'height': radius,
		'width': Math.sqrt(3)/2 * radius,
		'type': null, // should call change_tile_type() to change after creation
		'moisture': null, // should not be changed after creation (for now)
		'elevation': null, // should not be changed after creation (for now)
	        'seen': 0,
		'owner': null}; // should call change_tile_owner()
}

function hex_corners(x, y, r)
{
	r = r || radius;

	var angle_deg;
	var angle_rad;

	var hex_verts = [];
	for (var i = 0; i < 6; i++)
	{
		angle_deg = 60 * i   + 30;
		angle_rad = Math.PI / 180 * angle_deg;
		hex_verts = hex_verts.concat([x + r * Math.cos(angle_rad), y + r * Math.sin(angle_rad), 0]);
	}

	return hex_verts;
}

function create_hexes_instance_arrays(hexes)
{
	hexes_instance_arrays = {};

	for (let hex of hexes)
	{
		if(!hexes_instance_arrays.hasOwnProperty(hex.type))
		{
			if (!instance_buffers.hasOwnProperty(hex.type))
			{
				instance_buffers[hex.type] = gl.createBuffer();
			}
			hexes_instance_arrays[hex.type] = new Float32Array(hex_types_count[hex.type] * 7);
			hex_types_current[hex.type] = 0;
		}
		hexes_instance_arrays[hex.type][hex_types_current[hex.type]] = hex.x;
		hexes_instance_arrays[hex.type][hex_types_current[hex.type] + 1] = hex.y;
		hexes_instance_arrays[hex.type][hex_types_current[hex.type] + 2] = 0;
		hexes_instance_arrays[hex.type][hex_types_current[hex.type] + 3] = hex_types[hex.type][0];
		hexes_instance_arrays[hex.type][hex_types_current[hex.type] + 4] = hex_types[hex.type][1];
		hexes_instance_arrays[hex.type][hex_types_current[hex.type] + 5] = hex_types[hex.type][2];
		hexes_instance_arrays[hex.type][hex_types_current[hex.type] + 6] = hex.seen;
		hex_types_current[hex.type] += 7;
	}

	for (let key in instance_buffers)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffers[key]);
		gl.bufferData(gl.ARRAY_BUFFER, hexes_instance_arrays[key], gl.STREAM_DRAW);
	}

	return hexes_instance_arrays;
}

function get_hex_at(x, y)
{
	return hexes[x * rows + y];
}

// TODO: improve performance of this function
function change_hex_type(hex, type)
{
	/*
	let array = instance_arrays_of_hexes[hex.type];
	let i = array.length;
	for (; i > 0; i--)
	{
		// hack to check if it is the same hex, we probably shouldn't be search linearly anyway
		if (Math.abs(hex.x - array[i]) <= 0.000001 && Math.abs(hex.y - array[i+1]) <= 0.000001)
		{
			break;
		}
	}
	let temp_array = Array.from(array);
	let removed = temp_array.splice(i, 6);
    removed[3] = hex_types[type][0];
    removed[4] = hex_types[type][1];
    removed[5] = hex_types[type][2];
	instance_arrays_of_hexes[hex.type] = new Float32Array(temp_array);
	instance_arrays_of_hexes[type] = new Float32Array(Array.from(instance_arrays_of_hexes[type]).concat(removed));
	hex.type = type;
	*/

	hex_types_count[type] += 1;
	hex_types_count[hex.type] -= 1;
	hex.type = type;
	instance_arrays_of_hexes = create_hexes_instance_arrays(hexes);
}

function change_tile_owner(hex, owner)
{
	if (hex.owner === owner) return;

	owner.tiles.push(hex);
	hex.owner = owner;
	// TODO: call bufferdata
}

function hex_distance(a, b)
{
	return hex_distance_points(a.grid_x, a.grid_y, b.grid_x, b.grid_y);
}

function hex_distance_points(ax, ay, bx, by)
{
	return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(ax + ay - bx - by));
}

function hex_get_neighbors(hex)
{
	let neighbors = [];

	if (hex.grid_x > 0)
	{
		neighbors.push(hexes[(hex.grid_x-1) * rows + hex.grid_y]);
	}
	if (hex.grid_x < columns-1)
	{
		neighbors.push(hexes[(hex.grid_x+1) * rows + hex.grid_y]);
	}
	if (hex.grid_y > 0)
	{
		neighbors.push(hexes[(hex.grid_x) * rows + hex.grid_y-1]);
		if (hex.grid_x < columns-1)
		{
			neighbors.push(hexes[(hex.grid_x+1) * rows + hex.grid_y-1]);
		}
	}
	if (hex.grid_y < rows-1)
	{
		if (hex.grid_x > 0)
		{
			neighbors.push(hexes[(hex.grid_x-1) * rows + hex.grid_y+1]);
		}
		neighbors.push(hexes[(hex.grid_x) * rows + hex.grid_y+1]);
	}

	return neighbors;
}
