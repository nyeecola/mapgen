function initGL() {
	canvas = document.getElementById('canvas');

	let gl = canvas.getContext('webgl');
	let width = window.innerWidth;
	let height = window.innerHeight;

	canvas.width = width;
	canvas.height = height;

	gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	gl.clearColor(0.7, 0.7, 0.7, 1);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	gl.enable(gl.SAMPLE_COVERAGE);
	gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
	gl.sampleCoverage(1, false);

	window.addEventListener('resize', function() {
		gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	});

	return gl;
}

function createShaders(gl, type)
{
	let shaderScript = '';
	let shader;

	switch(type) {
		case 'fragment':
			shaderScript = document.querySelector('#shader-fs').textContent;
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			break;
		case 'fragment-gui':
			shaderScript = document.querySelector('#shader-fs-gui').textContent;
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			break;
		case 'vertex':
			shaderScript = document.querySelector('#shader-vs').textContent;
			shader = gl.createShader(gl.VERTEX_SHADER);
			break;
		case 'vertex-gui':
			shaderScript = document.querySelector('#shader-vs-gui').textContent;
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
	let vertexShader = createShaders(gl, 'vertex');
	let fragmentShader = createShaders(gl, 'fragment');
	let vertex_shader_gui = createShaders(gl, 'vertex-gui');
	let fragment_shader_gui = createShaders(gl, 'fragment-gui');

	let shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	console.log(gl.getProgramInfoLog(shaderProgram));
	return {'main': shaderProgram, 'gui': shader_program_gui};
}

function upload_grid_static_data()
{
	{
		let hex_indices = [0, 1, 2, 0, 2, 3, 0, 3, 5, 3, 4, 5];
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grid_indices_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hex_indices), gl.STATIC_DRAW);
	}

	{
		let hex_verts = hex_corners(0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, grid_shape_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hex_verts), gl.STATIC_DRAW);
	}

	{
		let tex_coords = [1, 0, 0.5, -0.5, 0, 0, 0, 1, 0.5, 1.5, 1, 1];
		gl.bindBuffer(gl.ARRAY_BUFFER, grid_tex_coords_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex_coords), gl.STATIC_DRAW);
	}
}

function upload_mountain_static_data()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, mountain_shape_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(global_mesh_data.vertices), gl.STATIC_DRAW);

	let mesh_indices = [].concat.apply([], global_mesh_data.faces);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mountain_indices_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh_indices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, mountain_tex_coords_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(global_mesh_data.texturecoords[0]), gl.STATIC_DRAW);
}

function upload_forest_static_data()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, forest_shape_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(global_mesh_data2.vertices), gl.STATIC_DRAW);

	let mesh_indices = [].concat.apply([], global_mesh_data2.faces);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, forest_indices_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh_indices), gl.STATIC_DRAW);
}

function upload_settler_static_data()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, settler_shape_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(global_mesh_data3.vertices), gl.STREAM_DRAW);

	let mesh_indices = [].concat.apply([], global_mesh_data3.faces);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, settler_indices_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh_indices), gl.STREAM_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, settler_tex_coords_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(global_mesh_data3.texturecoords[0]), gl.STREAM_DRAW);
}

function draw_mountains()
{
	// change model matrix
	let model = mat4.create();
	model = mat4.scale(model, model, vec3.fromValues(0.08, 0.08, 0.08));
	model = mat4.translate(model, model, vec3.fromValues(0.0, 0.0, 0.4));
	uniform_loc = gl.getUniformLocation(shader_program, 'model');
	gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);

	let attrib_loc;

	// bind shape vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, mountain_shape_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'position');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 3 * 4, 0);

	// bind indices vbo
	let mesh_indices = [].concat.apply([], global_mesh_data.faces);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mountain_indices_buffer);

	// disable tex_coord_offset and enable texture
	gl.uniform1f(gl.getUniformLocation(shader_program, 'tex_coord_offset'), 0);
	gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_enabled'), 1);

	// bind texture coords vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, mountain_tex_coords_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);

	// activate texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, mountain_model_texture);
	gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_sampler'), 0);

	// bind instancing vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffers['mountain']);
	attrib_loc = gl.getAttribLocation(shader_program, 'model_position');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 7 * 4, 0);
	ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

	attrib_loc = gl.getAttribLocation(shader_program, 'outside_fow');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 1, gl.FLOAT, gl.FALSE, 7 * 4, 6 * 4);
	ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

	attrib_loc = gl.getAttribLocation(shader_program, 'color');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 7 * 4, 3 * 4);
	ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

	ext.instancing.drawElementsInstancedANGLE(gl.TRIANGLES, mesh_indices.length, gl.UNSIGNED_SHORT, 0, instance_arrays_of_hexes['mountain'].length/7);
}

function draw_forests()
{
	// change model matrix
	let model = mat4.create();
	model = mat4.scale(model, model, vec3.fromValues(0.02, 0.02, 0.03));
	model = mat4.translate(model, model, vec3.fromValues(0.0, 0.0, 0.4));
	model_loc = gl.getUniformLocation(shader_program, 'model');
	gl.uniformMatrix4fv(model_loc, gl.FALSE, model);

	let attrib_loc;

	// bind forest shape vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, forest_shape_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'position');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 3 * 4, 0);

	// bind indices vbo
	mesh_indices = [].concat.apply([], global_mesh_data2.faces);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, forest_indices_buffer);

	// disable texture
	attrib_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
	gl.disableVertexAttribArray(attrib_loc);
	gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_enabled'), 0);

	// bind forest instancing vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffers['forest']);
	attrib_loc = gl.getAttribLocation(shader_program, 'model_position');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 7 * 4, 0);
	ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

	attrib_loc = gl.getAttribLocation(shader_program, 'outside_fow');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 1, gl.FLOAT, gl.FALSE, 7 * 4, 6 * 4);
	ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

	attrib_loc = gl.getAttribLocation(shader_program, 'color');
	gl.disableVertexAttribArray(attrib_loc);
	gl.vertexAttrib3f(attrib_loc, 0.1, 0.6, 0.1);
	ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

	ext.instancing.drawElementsInstancedANGLE(gl.TRIANGLES, mesh_indices.length, gl.UNSIGNED_SHORT, 0, instance_arrays_of_hexes['forest'].length/7);
}

function draw_settler(x, y)
{
	let attrib_loc, uniform_loc;

	// change model matrix
	let model = mat4.create();
	model = mat4.scale(model, model, vec3.fromValues(0.02, 0.02, 0.02));
	model = mat4.translate(model, model, vec3.fromValues(0.0, 0.0, 0.4));
	uniform_loc = gl.getUniformLocation(shader_program, 'model');
	gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);

	// bind shape vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, settler_shape_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'position');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 3 * 4, 0);

	// bind indices vbo
	let mesh_indices = [].concat.apply([], global_mesh_data3.faces);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, settler_indices_buffer);

	// enable texture
	gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_enabled'), 1);

	// bind texture coords vbo
	gl.bindBuffer(gl.ARRAY_BUFFER, settler_tex_coords_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);

	// activate texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, settler_model_texture);
	gl.uniform1i(gl.getUniformLocation(shader_program, 'texture_sampler'), 0);

	// set model position
	attrib_loc = gl.getAttribLocation(shader_program, 'model_position');
	gl.disableVertexAttribArray(attrib_loc);
	gl.vertexAttrib3f(attrib_loc, hexes[x * rows + y].x, hexes[x * rows + y].y, 0);

	attrib_loc = gl.getAttribLocation(shader_program, 'outside_fow');
	gl.disableVertexAttribArray(attrib_loc);
	gl.vertexAttrib1f(attrib_loc, 1);

	attrib_loc = gl.getAttribLocation(shader_program, 'color');
	gl.disableVertexAttribArray(attrib_loc);
	gl.vertexAttrib3f(attrib_loc, 1, 1, 1);

	gl.drawElements(gl.TRIANGLES, mesh_indices.length, gl.UNSIGNED_SHORT, 0);

	// reset model matrix transformations
	uniform_loc = gl.getUniformLocation(shader_program, 'model');
	gl.uniformMatrix4fv(uniform_loc, gl.FALSE, mat4.create());
}

function draw_grid_tiles(dt)
{
	let attrib_loc;

	// bind grid indices vbo
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grid_indices_buffer);

	// bind grid shape vbo and set attrib pointer
	gl.bindBuffer(gl.ARRAY_BUFFER, grid_shape_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'position');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 3 * 4, 0);

	// bind grid tex coords vbo and set attrib pointer
	gl.bindBuffer(gl.ARRAY_BUFFER, grid_tex_coords_buffer);
	attrib_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
	gl.enableVertexAttribArray(attrib_loc);
	gl.vertexAttribPointer(attrib_loc, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);

	offset_tex_animation += 0.0001 * dt;
	if (offset_tex_animation > 2) offset_tex_animation = 0;
	for (let array in instance_arrays_of_hexes)
	{
		if (array === 'ocean' || array === 'sea')
		{
			let loc = gl.getUniformLocation(shader_program, 'tex_coord_offset');
			gl.uniform1f(loc, offset_tex_animation);
		}
		else
		{
			let loc = gl.getUniformLocation(shader_program, 'tex_coord_offset');
			gl.uniform1f(loc, 0);
		}

		// bind grid instancing vbo
		gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffers[array]);
		attrib_loc = gl.getAttribLocation(shader_program, 'model_position');
		gl.enableVertexAttribArray(attrib_loc);
		gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 7 * 4, 0);
		ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

		attrib_loc = gl.getAttribLocation(shader_program, 'outside_fow');
		gl.enableVertexAttribArray(attrib_loc);
		gl.vertexAttribPointer(attrib_loc, 1, gl.FLOAT, gl.FALSE, 7 * 4, 6 * 4);
		ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

		attrib_loc = gl.getAttribLocation(shader_program, 'color');
		gl.enableVertexAttribArray(attrib_loc);
		gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 7 * 4, 3 * 4);
		ext.instancing.vertexAttribDivisorANGLE(attrib_loc, 1);

		// use texture on tiles that have one and don't use them in tiles that haven't
		if (hex_types[array][3])
		{
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, hex_types[array][3]);
			uniform_loc = gl.getUniformLocation(shader_program, 'texture_sampler');
			gl.uniform1i(uniform_loc, 0);

			uniform_loc = gl.getUniformLocation(shader_program, 'texture_enabled');
			gl.uniform1i(uniform_loc, 1);
		}
		else
		{
			uniform_loc = gl.getUniformLocation(shader_program, 'texture_enabled');
			gl.uniform1i(uniform_loc, 0);
		}


		// draw tiles
		let model = mat4.create();
		let hex_width = Math.sqrt(3)/2 * radius;
		let map_width = 2 * columns * hex_width;
		model = mat4.translate(model, model, vec3.fromValues(test_loc * map_width, 0, 0));
		uniform_loc = gl.getUniformLocation(shader_program, 'model');
		gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);
		ext.instancing.drawElementsInstancedANGLE(gl.TRIANGLES, 4 * 3, gl.UNSIGNED_SHORT, 0, instance_arrays_of_hexes[array].length/7);

		// TEST
		if (!test_dir)
		{
			model = mat4.create();
			model = mat4.translate(model, model, vec3.fromValues((test_loc - 1) * map_width, 0, 0));
			uniform_loc = gl.getUniformLocation(shader_program, 'model');
			gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);
			ext.instancing.drawElementsInstancedANGLE(gl.TRIANGLES, 4 * 3, gl.UNSIGNED_SHORT, 0, instance_arrays_of_hexes[array].length/7);
		}
		else
		{
			model = mat4.create();
			model = mat4.translate(model, model, vec3.fromValues((test_loc + 1) * map_width, 0, 0));
			uniform_loc = gl.getUniformLocation(shader_program, 'model');
			gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);
			ext.instancing.drawElementsInstancedANGLE(gl.TRIANGLES, 4 * 3, gl.UNSIGNED_SHORT, 0, instance_arrays_of_hexes[array].length/7);
		}

		// draw grid outline if grid_mode is enabled
		if (grid_mode)
		{
			let model = mat4.create();
			model = mat4.translate(model, model, vec3.fromValues(0, 0, 0.001));
			uniform_loc = gl.getUniformLocation(shader_program, 'model');
			gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);

			uniform_loc = gl.getUniformLocation(shader_program, 'texture_enabled');
			gl.uniform1i(uniform_loc, 0);

			attrib_loc = gl.getAttribLocation(shader_program, 'color');
			gl.disableVertexAttribArray(attrib_loc);
			gl.vertexAttrib3f(attrib_loc, 0, 0, 0);
			ext.instancing.drawArraysInstancedANGLE(gl.LINE_LOOP, 0, 6, instance_arrays_of_hexes[array].length/7);
		}

		// clean model modifications
		uniform_loc = gl.getUniformLocation(shader_program, 'model');
		gl.uniformMatrix4fv(uniform_loc, gl.FALSE, mat4.create());
	}
}

// TODO: maybe stop uploading buffer data every single frame
function draw_region(region, color)
{
	let attrib_loc, uniform_loc;

	// reset model matrix transformations
	uniform_loc = gl.getUniformLocation(shader_program, 'model');
	gl.uniformMatrix4fv(uniform_loc, gl.FALSE, mat4.create());

	let shape = [];

	// TODO: check for out of bounds
	for (let hex of region)
	{
		// don't draw borders on undiscovered tiles
		// TODO: don't update borders on discovered but not currently seen tiles
		if (!hex.seen.hasOwnProperty(selected_player.id) || hex.seen[selected_player.id] < 0) continue;

		let line_width = 0.015;
		let outer_corners = hex_corners(hex.x, hex.y);
		let inner_corners = hex_corners(hex.x, hex.y, radius - line_width);
		if (hexes[hex.grid_x * rows + hex.grid_y + 1].owner !== hex.owner)
		{
			shape = shape.concat([
				outer_corners[0 * 3 + 0],
				outer_corners[0 * 3 + 1],
				0,
				outer_corners[1 * 3 + 0],
				outer_corners[1 * 3 + 1],
				0,
				inner_corners[0 * 3 + 0],
				inner_corners[0 * 3 + 1],
				0,
				inner_corners[0 * 3 + 0],
				inner_corners[0 * 3 + 1],
				0,
				outer_corners[1 * 3 + 0],
				outer_corners[1 * 3 + 1],
				0,
				inner_corners[1 * 3 + 0],
				inner_corners[1 * 3 + 1],
				0
			]);
		}
		if (hexes[(hex.grid_x - 1) * rows + hex.grid_y + 1].owner !== hex.owner)
		{
			shape = shape.concat([
				outer_corners[1 * 3 + 0],
				outer_corners[1 * 3 + 1],
				0,
				outer_corners[2 * 3 + 0],
				outer_corners[2 * 3 + 1],
				0,
				inner_corners[1 * 3 + 0],
				inner_corners[1 * 3 + 1],
				0,
				inner_corners[1 * 3 + 0],
				inner_corners[1 * 3 + 1],
				0,
				outer_corners[2 * 3 + 0],
				outer_corners[2 * 3 + 1],
				0,
				inner_corners[2 * 3 + 0],
				inner_corners[2 * 3 + 1],
				0
			]);
		}
		if (hexes[(hex.grid_x - 1) * rows + hex.grid_y].owner !== hex.owner)
		{
			shape = shape.concat([
				outer_corners[2 * 3 + 0],
				outer_corners[2 * 3 + 1],
				0,
				outer_corners[3 * 3 + 0],
				outer_corners[3 * 3 + 1],
				0,
				inner_corners[2 * 3 + 0],
				inner_corners[2 * 3 + 1],
				0,
				inner_corners[2 * 3 + 0],
				inner_corners[2 * 3 + 1],
				0,
				outer_corners[3 * 3 + 0],
				outer_corners[3 * 3 + 1],
				0,
				inner_corners[3 * 3 + 0],
				inner_corners[3 * 3 + 1],
				0
			]);
		}
		if (hexes[(hex.grid_x) * rows + hex.grid_y - 1].owner !== hex.owner)
		{
			shape = shape.concat([
				outer_corners[3 * 3 + 0],
				outer_corners[3 * 3 + 1],
				0,
				outer_corners[4 * 3 + 0],
				outer_corners[4 * 3 + 1],
				0,
				inner_corners[3 * 3 + 0],
				inner_corners[3 * 3 + 1],
				0,
				inner_corners[3 * 3 + 0],
				inner_corners[3 * 3 + 1],
				0,
				outer_corners[4 * 3 + 0],
				outer_corners[4 * 3 + 1],
				0,
				inner_corners[4 * 3 + 0],
				inner_corners[4 * 3 + 1],
				0
			]);
		}
		if (hexes[(hex.grid_x + 1) * rows + hex.grid_y - 1].owner !== hex.owner)
		{
			shape = shape.concat([
				outer_corners[4 * 3 + 0],
				outer_corners[4 * 3 + 1],
				0,
				outer_corners[5 * 3 + 0],
				outer_corners[5 * 3 + 1],
				0,
				inner_corners[4 * 3 + 0],
				inner_corners[4 * 3 + 1],
				0,
				inner_corners[4 * 3 + 0],
				inner_corners[4 * 3 + 1],
				0,
				outer_corners[5 * 3 + 0],
				outer_corners[5 * 3 + 1],
				0,
				inner_corners[5 * 3 + 0],
				inner_corners[5 * 3 + 1],
				0
			]);
		}
		if (hexes[(hex.grid_x + 1) * rows + hex.grid_y].owner !== hex.owner)
		{
			shape = shape.concat([
				outer_corners[5 * 3 + 0],
				outer_corners[5 * 3 + 1],
				0,
				outer_corners[0 * 3 + 0],
				outer_corners[0 * 3 + 1],
				0,
				inner_corners[5 * 3 + 0],
				inner_corners[5 * 3 + 1],
				0,
				inner_corners[5 * 3 + 0],
				inner_corners[5 * 3 + 1],
				0,
				outer_corners[0 * 3 + 0],
				outer_corners[0 * 3 + 1],
				0,
				inner_corners[0 * 3 + 0],
				inner_corners[0 * 3 + 1],
				0
			]);
		}
	}

	if (shape.length)
	{
		// bind grid shape vbo and set attrib pointer
		gl.bindBuffer(gl.ARRAY_BUFFER, region_shape_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape), gl.STATIC_DRAW); // TODO: move
		attrib_loc = gl.getAttribLocation(shader_program, 'position');
		gl.enableVertexAttribArray(attrib_loc);
		gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 3 * 4, 0);

		// disable texture
		uniform_loc = gl.getUniformLocation(shader_program, 'texture_enabled');
		gl.uniform1i(uniform_loc, 0);
		attrib_loc = gl.getAttribLocation(shader_program, 'p_tex_coord');
		gl.disableVertexAttribArray(attrib_loc);

		// set model position attrib
		attrib_loc = gl.getAttribLocation(shader_program, 'model_position');
		gl.disableVertexAttribArray(attrib_loc);
		gl.vertexAttrib3f(attrib_loc, 0, 0, 0);

		attrib_loc = gl.getAttribLocation(shader_program, 'outside_fow');
		gl.disableVertexAttribArray(attrib_loc);
		gl.vertexAttrib1f(attrib_loc, 1); // TEST

		attrib_loc = gl.getAttribLocation(shader_program, 'color');
		gl.disableVertexAttribArray(attrib_loc);
		gl.vertexAttrib3f(attrib_loc, color.r, color.g, color.b);

		gl.drawArrays(gl.TRIANGLES, 0, shape.length/3);
	}
}

