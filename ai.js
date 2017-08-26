// TODO: use turns instead
let AI_timer = 0;

// NOTE: for now hardcoded enemy
function AI_do_action()
{
	for (let unit of enemy.units)
	{
		let factor = Math.floor(Math.random() * 20);

		if (factor === 0) move_unit(unit, unit.x - 1, unit.y);
		if (factor === 1) move_unit(unit, unit.x + 1, unit.y);
		if (factor === 2) move_unit(unit, unit.x, unit.y - 1);
		if (factor === 3) move_unit(unit, unit.x, unit.y + 1);
		if (factor === 4) unit_build(unit);
	}
}
