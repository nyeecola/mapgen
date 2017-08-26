// TODO: use turns instead
let AI_timer = 0;

// for now hardcoded enemy
function AI_do_action()
{
	for (let unit of enemy.units)
	{
		move_unit(unit, unit.x - 1, unit.y);
	}
}
