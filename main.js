let offset_y_tex = 0;

function update_and_render(time)
{
	// update
	{
		dt = time - last_time;
		last_time = time;
		if (dt < 0) dt = 0.0000001;


		if ('ArrowRight' in key_state && key_state['ArrowRight'])
			camera.x -= dt * camera.speed;
		if ('ArrowLeft' in key_state && key_state['ArrowLeft'])
			camera.x += dt * camera.speed;
		if ('ArrowUp' in key_state && key_state['ArrowUp'])
			camera.y -= dt * camera.speed;
		if ('ArrowDown' in key_state && key_state['ArrowDown'])
			camera.y += dt * camera.speed;
	}

	// render frame
	{
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.useProgram(shader_program);

		// camera view matrix
		let view = mat4.create();
		view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
		view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));

		// perspective projection matrix
		let projection = mat4.create();
		projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);

		// model matrix
		let model = mat4.create();

		// upload all uniforms
		let uniform_loc;
		uniform_loc = gl.getUniformLocation(shader_program, "view");
		gl.uniformMatrix4fv(uniform_loc, gl.FALSE, view);
		uniform_loc = gl.getUniformLocation(shader_program, "projection");
		gl.uniformMatrix4fv(uniform_loc, gl.FALSE, projection);
		uniform_loc = gl.getUniformLocation(shader_program, "model");
		gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);


		// upload data to indices buffer
		let hex_indices = [0, 1, 2, 0, 2, 3, 0, 3, 5, 3, 4, 5];
		{

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hex_indices), gl.STATIC_DRAW);
		}

		// upload data to array_buffer
		// attach buffer data to position attribute
		// TODO: make this more readable, also it is way overcomplicated
		let hex_verts = hex_corners(0, 0);
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, array_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hex_verts), gl.STATIC_DRAW);

			let attrib_loc = gl.getAttribLocation(shader_program, 'position');
			gl.enableVertexAttribArray(attrib_loc);
			gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 3 * 4, 0);
		}

		if (!ext) {
			// TODO: create fallback
		}
		else 
		{
			// upload data to tex_coords_buffer
			// attach buffer data to p_tex_coord attribute
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, tex_coords_buffer);

				//let tex_coords = [1, 0.33, 0.5, 0, 0, 0.33, 0, 0.67, 0.5, 1, 1, 0.67];
				let tex_coords = [1, 0, 0.5, -0.5, 0, 0, 0, 1, 0.5, 1.5, 1, 1];
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex_coords), gl.STATIC_DRAW);

				let tex_coord_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
				gl.enableVertexAttribArray(tex_coord_loc);
				gl.vertexAttribPointer(tex_coord_loc, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);
			}


			// bind instance_buffer
			// attach buffer data to model_position attribute
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffer);

				let model_pos_loc = gl.getAttribLocation(shader_program, 'model_position');
				gl.enableVertexAttribArray(model_pos_loc);
				gl.vertexAttribPointer(model_pos_loc, 3, gl.FLOAT, gl.FALSE, 6 * 4, 0);
				ext.vertexAttribDivisorANGLE(model_pos_loc, 1);
			}

			offset_y_tex += 0.0001 * dt;
			if (offset_y_tex > 2) offset_y_tex = 0;
			for (let array in instance_arrays_of_hexes)
			{
				if (array === 'ocean' || array === 'sea')
				{
					gl.uniform1f(gl.getUniformLocation(shader_program, 'tex_coord_y_offset'), offset_y_tex);
				}
				else
				{
					gl.uniform1f(gl.getUniformLocation(shader_program, 'tex_coord_y_offset'), 0);
				}

				// attach buffer data to color attribute
				let color_loc = gl.getAttribLocation(shader_program, 'color');
				gl.enableVertexAttribArray(color_loc);
				gl.vertexAttribPointer(color_loc, 3, gl.FLOAT, gl.FALSE, 6 * 4, 3 * 4);
				ext.vertexAttribDivisorANGLE(color_loc, 1);

				// upload data to instance_buffer
				gl.bufferData(gl.ARRAY_BUFFER, instance_arrays_of_hexes[array], gl.STATIC_DRAW);

				// use texture on tiles that have one and don't use them in tiles that haven't
				if (hex_types[array][3] !== null)
				{
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, hex_types[array][3]);
					gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_sampler'), 0);

					let tex_enable_loc = gl.getUniformLocation(shader_program, "texture_enabled");
					gl.uniform1i(tex_enable_loc, 1);
				}
				else
				{
					let tex_enable_loc = gl.getUniformLocation(shader_program, "texture_enabled");
					gl.uniform1i(tex_enable_loc, 0);
				}

				// draw tiles
				ext.drawElementsInstancedANGLE(gl.TRIANGLES, hex_indices.length, gl.UNSIGNED_SHORT, 0, instance_arrays_of_hexes[array].length/6);

				// draw grid if grid_mode is enabled
				if (grid_mode)
				{
					let model = mat4.create();
					model = mat4.translate(model, model, vec3.fromValues(0, 0, 0.001));
					uniform_loc = gl.getUniformLocation(shader_program, "model");
					gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);

					let tex_enable_loc = gl.getUniformLocation(shader_program, "texture_enabled");
					gl.uniform1i(tex_enable_loc, 0);

					gl.disableVertexAttribArray(color_loc);
					gl.vertexAttrib3f(color_loc, 0, 0, 0);
					ext.drawArraysInstancedANGLE(gl.LINE_LOOP, 0, hex_verts.length/3, instance_arrays_of_hexes[array].length/6);
				}
			}
		}
	}

	requestAnimationFrame(update_and_render);
}

function main()
{
	gl = initGL();
	ext = gl.getExtension('ANGLE_instanced_arrays');
	shader_program = initShaders(gl);
	hexes = [];

	// choose elevation position
	//let num_elevations = 1 + Math.floor(Math.random() * max_elevations);
	let num_elevations = 2;
	let elevations = [];

	// TODO: maybe there should be more than one
	let moisture_point = [
		20 + Math.floor(Math.random() * (columns - 20 * 2)),
		30 + Math.floor(Math.random() * (rows - 30 * 2)),
	];

	let mountain_level = 0.07 + Math.floor(Math.random() * 0.04);

	for (let i = 0; i < num_elevations; i++)
	{
		elevations.push([]);
		elevations[i].push(Math.floor(columns / num_elevations * i + columns / num_elevations / 2));
		elevations[i].push(Math.floor(rows / 2));
	}

	let width = Math.sqrt(3)/2 * radius;
	for (let j = 0; j < columns; j++) {
		for (let i = 0; i < rows; i++) {
			let hex = create_hex(i * width + j * width * 2, i * 3/4 * 2 * radius, j, i);

			// elevation
			let dist = columns * 1.2 + rows;
			hex.elevation = dist * num_elevations;
			for (let k = 0; k < num_elevations; k++)
			{
				let cur_dist = 1.2 * hex_distance_points(j, i, elevations[k][0], elevations[k][1]);
				dist = Math.min(dist, cur_dist);
				hex.elevation -= cur_dist;
			}

			hex.elevation /= (columns * 1.2 + rows) * num_elevations;
			hex.elevation -= 7.8/10;


			let random_factor = Math.random() * 0.014;
			random_factor -= 0.014 / 2;
			hex.elevation += random_factor;

			hex.elevation += perlin(j / 7.5, i / 7.5) * 0.30;

			// moisture
			hex.moisture = 0;
			hex.moisture += perlin(j / 11.4, i / 11.4) * 1;
			let cur_dist = 1.2 * hex_distance_points(j, i, moisture_point[0], moisture_point[1]);
			hex.moisture -= cur_dist * 0.0024;

			let candidates = {};

			// top and bottom
			if (hex.grid_y < 0.04 * rows || hex.grid_y > 0.95 * rows)
			{
				candidates['ice'] = 100;
				candidates['ocean'] = 4;
			}
			else
			{
				if (hex.elevation > sea_level)
				{
					if (hex.elevation > mountain_level) candidates['mountain'] = 100;
					else candidates['mountain'] = 1;

					if (hex.moisture > -0.14)
					{
						candidates['forest'] = 100;
						candidates['grassland'] = 1;
						candidates['desert'] = 0;
					}
					else if (hex.moisture < -0.24)
					{
						if (hex.grid_y < 0.16 * rows || hex.grid_y > 0.84 * rows)
						{
							candidates['desert'] = 0;
							candidates['mountain'] /= 10;
						}
						else if (hex.grid_y < 0.16 * rows || hex.grid_y > 0.84 * rows)
						{
							candidates['desert'] = 240;
						}
						else
						{
							candidates['desert'] = 100;
						}

						candidates['forest'] = 0;
						candidates['grassland'] = 1;
					}
					else
					{
						candidates['forest'] = 50 * Math.abs(hex.moisture);
						candidates['grassland'] = 10000;
						candidates['desert'] = 50 - 50 * Math.abs(hex.moisture);
					}
				}
				else
				{
					candidates['ocean'] = 100;
				}
			}

			let candidates_total = 0;
			for (let candidate in candidates)
			{
				candidates_total += candidates[candidate];
			}

			let candidates_ratio = [];
			let candidates_names = [];
			let last_ratio = 0;
			for (let candidate in candidates)
			{
				candidates_names.push(candidate);
				last_ratio += candidates[candidate] / candidates_total;
				candidates_ratio.push(last_ratio);
			}

			let random_number = Math.random();
			let chosen;
			for (let ci = 0; ci < candidates_ratio.length; ci++)
			{
				if (candidates_ratio[ci] > random_number)
				{
					chosen = ci;
					break;
				}
			}

			hex.type = candidates_names[chosen];
			hexes.push(hex);
		}
	}

	// costal sea line
	for (let j = 1; j < columns - 1; j++) {
		for (let i = 1; i < rows - 1; i++) {
			let hex = hexes[j * rows + i];
			if (hex.type == 'ocean' && (
			    (hexes[(j-1) * rows + i].type != 'ocean' && hexes[(j-1) * rows + i].type != 'sea') ||
			    (hexes[(j+1) * rows + i].type != 'ocean' && hexes[(j+1) * rows + i].type != 'sea') ||
			    (hexes[(j) * rows + (i-1)].type != 'ocean' && hexes[(j) * rows + (i-1)].type != 'sea') ||
			    (hexes[(j+1) * rows + (i-1)].type != 'ocean' && hexes[(j+1) * rows + (i-1)].type != 'sea') ||
			    (hexes[(j-1) * rows + (i+1)].type != 'ocean' && hexes[(j-1) * rows + (i+1)].type != 'sea') ||
			    (hexes[(j) * rows + (i+1)].type != 'ocean' && hexes[(j) * rows + (i+1)].type != 'sea')))
			{
				hex.type = 'sea';
			}
			//hex.type = candidates_names[chosen];
			//hexes.push(hex);
		}
	}

	array_buffer = gl.createBuffer();
	indices_buffer = gl.createBuffer();
	instance_buffer = gl.createBuffer();
	tex_coords_buffer = gl.createBuffer()

	camera = {'x': -6, 'y': -2.5, 'z': -2.8, 'speed': 0.004};

	// TEST
	// TODO: wait for image to be loaded before starting to render scene
	// TODO: refactor this mess
	hex_types['forest'][3] = gl.createTexture();
	let image = new Image();
	image.crossOrigin = 'anonymous';
	image.onload = function() { handle_texture_loaded(image, hex_types['forest'][3]); }.bind(image);
	image.src = 'http://i.imgur.com/n7ezMnp.png';

	hex_types['grassland'][3] = gl.createTexture();
	let image2 = new Image();
	image2.crossOrigin = 'anonymous';
	image2.onload = function() { handle_texture_loaded(image2, hex_types['grassland'][3]); }.bind(image2);
	image2.src = 'http://i.imgur.com/RVZxP2K.png';

	hex_types['desert'][3] = gl.createTexture();
	let image3 = new Image();
	image3.crossOrigin = 'anonymous';
	image3.onload = function() { handle_texture_loaded(image3, hex_types['desert'][3]); }.bind(image3);
	image3.src = 'http://i.imgur.com/1mbEioa.png';

	hex_types['ocean'][3] = gl.createTexture();
	let image4 = new Image();
	image4.crossOrigin = 'anonymous';
	image4.onload = function() { handle_texture_loaded(image4, hex_types['ocean'][3]); }.bind(image4);
	image4.src = 'http://i.imgur.com/3TVWpk4.png';
	
	hex_types['sea'][3] = gl.createTexture();
	let image5 = new Image();
	image5.crossOrigin = 'anonymous';
	image5.onload = function() { handle_texture_loaded(image5, hex_types['sea'][3]); }.bind(image5);
	image5.src = 'http://i.imgur.com/jWjT3AH.png';

	instance_arrays_of_hexes = create_hexes_instance_arrays(hexes);

	requestAnimationFrame(update_and_render);
}

function handle_texture_loaded(image, texture)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

main();

