var test_texture;

function create_camera(x, y, z)
{
	return {'x': x,
		'y': y,
		'z': z,
		'speed': 0.004};
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

	let view = mat4.create();
	view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
	view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));

	let projection = mat4.create();
	projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);

	let uniform_loc;
	uniform_loc = gl.getUniformLocation(shader_program, "view");
	gl.uniformMatrix4fv(uniform_loc, gl.FALSE, view);
	uniform_loc = gl.getUniformLocation(shader_program, "projection");
	gl.uniformMatrix4fv(uniform_loc, gl.FALSE, projection);

	let hex_indices = [0, 1, 2, 0, 2, 3, 0, 3, 5, 3, 4, 5];

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hex_indices), gl.STATIC_DRAW);

	// TODO: make this more readable, also it is way overcomplicated
	let hex_verts = hex_corners(0, 0, 0.1);

	gl.bindBuffer(gl.ARRAY_BUFFER, array_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hex_verts), gl.STATIC_DRAW);

	let vertexLocation = gl.getAttribLocation(shader_program,"position");
	gl.enableVertexAttribArray(vertexLocation);
	gl.vertexAttribPointer(vertexLocation,3,gl.FLOAT,gl.FALSE,3 * 4,0);

	let model_loc = gl.getUniformLocation(shader_program, "model");
	let model = mat4.create();
	gl.uniformMatrix4fv(model_loc, gl.FALSE, model);


	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, test_texture);
	gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_sampler'), 0);

	let tex_coord_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
	gl.enableVertexAttribArray(tex_coord_loc);
	gl.vertexAttribPointer(tex_coord_loc,2,gl.FLOAT,gl.FALSE,3 * 4,0);

	if (!ext) {
		// TODO
		/*
    		let model_loc = gl.getUniformLocation(shader_program, "model");
    		let vertexColor = gl.getAttribLocation(shader_program, "color");
    		for (let hex of hexes) {

			// TEST
	    		//if (Math.abs(camera.x - hex.x) > 20 || Math.abs(camera.y - hex.y) > 20) continue;

      			let model = mat4.create();
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
	else 
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffer);

		let model_pos_loc = gl.getAttribLocation(shader_program, "model_position");
		gl.enableVertexAttribArray(model_pos_loc);
		gl.vertexAttribPointer(model_pos_loc, 3, gl.FLOAT, gl.FALSE, 6 * 4, 0);
		ext.vertexAttribDivisorANGLE(model_pos_loc, 1);

		let color_loc = gl.getAttribLocation(shader_program, "color");
		gl.enableVertexAttribArray(color_loc);
		gl.vertexAttribPointer(color_loc, 3, gl.FLOAT, gl.FALSE, 6 * 4, 3 * 4);
		ext.vertexAttribDivisorANGLE(color_loc, 1);

		// upload data
		gl.bufferData(gl.ARRAY_BUFFER, instance_array_of_hexes, gl.STATIC_DRAW);

		// draw tiles
		ext.drawElementsInstancedANGLE(gl.TRIANGLES, hex_indices.length, gl.UNSIGNED_SHORT, 0, hexes.length);

		// draw outline
		let model = mat4.create();
		model = mat4.translate(model, model, vec3.fromValues(0, 0, 0.001));
		gl.uniformMatrix4fv(model_loc, gl.FALSE, model);

		gl.disableVertexAttribArray(color_loc);
		gl.vertexAttrib3f(color_loc, 0, 0, 0);
		ext.drawArraysInstancedANGLE(gl.LINE_LOOP, 0, hex_verts.length/3, hexes.length);
	}

	requestAnimationFrame(draw)
}

function main()
{
	gl = initGL();
	ext = gl.getExtension('ANGLE_instanced_arrays');
	shader_program = initShaders(gl);
	hexes = []

	// choose elevation position
	//let num_elevations = 1 + Math.floor(Math.random() * max_elevations);
	let num_elevations = 2;
	let elevations = [];
	
	for (let i = 0; i < num_elevations; i++)
	{
		elevations.push([]);
		elevations[i].push(Math.floor(columns / num_elevations * i + columns / num_elevations / 2));
		elevations[i].push(Math.floor(rows / 2));
	}

	let start_x = 0;
	let width = Math.sqrt(3)/2 * radius;
	for (let j = 0; j < columns; j++) {
		for (let i = 0; i < rows; i++) {
			let hex = create_hex(i * width + j * width * 2, i * 3/4 * 2 * radius, j, i);

			let dist = columns + rows;
			hex.elevation = dist * num_elevations;
			for (let k = 0; k < num_elevations; k++)
			{
				let cur_dist = hex_distance_points(j, i, elevations[k][0], elevations[k][1]);
				dist = Math.min(dist, cur_dist);
				hex.elevation -= cur_dist;
			}

			//hex.elevation = columns + rows - dist;
			hex.elevation /= (columns + rows) * num_elevations;
			hex.elevation -= 8.0/10;


			let random_factor = Math.random() * 0.014;
			random_factor -= 0.014 / 2;
			hex.elevation += random_factor;

			hex.elevation += perlin(j / 9.5, i / 9.5) * 0.26;

			let types = Object.keys(hex_types);

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
				if (hex.elevation > 0.06)
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



	// TEST
	// TODO: wait for image to be loaded before starting to render scene
	test_texture = gl.createTexture();
	let image = new Image();
	image.crossOrigin = 'anonymous';
	image.onload = function() { handle_texture_loaded(image, test_texture); }.bind(image, test_texture)
	image.src = 'http://i.imgur.com/IlsnC1x.jpg';

	

	instance_array_of_hexes = create_hexes_instance_array(hexes);

	requestAnimationFrame(draw);
}

main();

function handle_texture_loaded(image, texture)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}
