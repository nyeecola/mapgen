let units = {
	'settler': {'x': null, 'y': null, 'name': 'settler', 'screen_name': 'Settler', 'owner': null}
};

function create_unit(owner, unit_name, x, y)
{
	if (unit_name in units)
	{
		let unit_template = units[unit_name];
		let unit = {};
		// NOTE: a shallow copy
		for (let attrib in unit_template)
		{
			unit[attrib] = unit_template[attrib];
		}
		unit.x = x;
		unit.y = y;
		unit.owner = owner;

		if (unit_name === 'settler')
		{
			// NOTE: just for settler testing purposes
			{
				let current_tile = hexes[unit.x * rows + unit.y];
				let neighbors = hex_get_neighbors(current_tile);

				current_tile.seen = 1;
				for (let hex of neighbors)
				{
					hex.seen = 1;
				}
				instance_arrays_of_hexes = create_hexes_instance_arrays(hexes);
			}
		}

		owner.units.push(unit);
	}
}

function destroy_unit(unit)
{
	unit.owner.units.splice(unit.owner.units.indexOf(unit), 1);
}

function move_unit(unit, x, y)
{
	let current_tile, neighbors;

	current_tile = hexes[unit.x * rows + unit.y];
	neighbors = hex_get_neighbors(current_tile);

	current_tile.seen -= 1;
	for (let hex of neighbors)
	{
		hex.seen -= 1;
	}

	unit.x = x;
	unit.y = y;

	current_tile = hexes[unit.x * rows + unit.y];
	neighbors = hex_get_neighbors(current_tile);

	current_tile.seen += 1;
	for (let hex of neighbors)
	{
		hex.seen += 1;
	}

	instance_arrays_of_hexes = create_hexes_instance_arrays(hexes);
}
