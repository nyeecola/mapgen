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

