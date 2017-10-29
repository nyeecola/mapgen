// NOTE: wrap-around test implementation
/*
let test_loc = 0;
let test_dir = 0;
*/

function update_and_render(time)
{
    let dt = time - last_time;
    last_time = time;
    if (dt < 0) dt = 0.0000001;
    //console.log(dt);

    // update
    {
        // TEST
        // update HUD
        if (test_mouse_over.moved)
        {
            test_mouse_over.cooldown += dt;
            // TODO: make this not hardcoded
            if (test_mouse_over.cooldown > 700)
            {
                test_mouse_over.x = test_mouse_over.candidate_x;
                test_mouse_over.y = test_mouse_over.candidate_y;
                test_mouse_over.cooldown = 0;
                update_hud();
                test_mouse_over.moved = false;
            }
        }

        AI_timer += dt;
        if (AI_timer > 500)
        {
            AI_timer -= 500;
            AI_do_action(enemy);
        }

        if ('ArrowRight' in key_state && key_state['ArrowRight'])
        {
            camera.x -= dt * camera.speed;

		/*
            // TEST
            let hex_width = Math.sqrt(3)/2 * radius;
            let map_width = 2 * columns * hex_width;
            test_loc = parseInt((camera.x * -1) / map_width);
            if (camera.x * -1 <= 0) test_loc -= 1;
            test_dir = parseInt((camera.x * -1) / (map_width / 2)) % 2;
            if (camera.x * -1 <= 0) test_dir = (test_dir + 1) % 2;
	    */
        }
        if ('ArrowLeft' in key_state && key_state['ArrowLeft'])
        {
            camera.x += dt * camera.speed;

            // TEST
	    /*
            let hex_width = Math.sqrt(3)/2 * radius;
            let map_width = 2 * columns * hex_width;
            test_loc = parseInt((camera.x * -1) / map_width);
            if (camera.x * -1 <= 0) test_loc -= 1;
            test_dir = parseInt((camera.x * -1) / (map_width / 2)) % 2;
            if (camera.x * -1 <= 0) test_dir = (test_dir + 1) % 2;
	    */
        }
        if ('ArrowUp' in key_state && key_state['ArrowUp'])
            camera.y -= dt * camera.speed;
        if ('ArrowDown' in key_state && key_state['ArrowDown'])
            camera.y += dt * camera.speed;
        if ('z' in key_state && key_state['z'])
            camera.zoom += dt * camera.speed * 0.2;
        if ('x' in key_state && key_state['x'])
            camera.zoom -= dt * camera.speed * 0.2;
    }

    // render frame
    {
        let attrib_loc;
        let uniform_loc;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shader_program);

        // camera view matrix
        let view = mat4.create();
        view = mat4.scale(view, view, vec3.fromValues(1.0 * camera.zoom, 1.0 * camera.zoom, 1.0));
        view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
        view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));

        // perspective projection matrix
        let projection = mat4.create();
        projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);

        // model matrix
        let model = mat4.create();

        // upload all matrix uniforms
        uniform_loc = gl.getUniformLocation(shader_program, 'view');
        gl.uniformMatrix4fv(uniform_loc, gl.FALSE, view);
        uniform_loc = gl.getUniformLocation(shader_program, 'projection');
        gl.uniformMatrix4fv(uniform_loc, gl.FALSE, projection);
        uniform_loc = gl.getUniformLocation(shader_program, 'model');
        gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);

        if (!ext) {
            // TODO: create fallback
        }
        else 
        {
            let uniform_loc = gl.getUniformLocation(shader_program, 'full_map_revealed');
            if (full_map_revealed) gl.uniform1i(uniform_loc, 1);
            else gl.uniform1i(uniform_loc, 0);

            // --- GRID TILES---
            draw_grid_tiles(dt);

            // --- MOUNTAINS ---
            if (mountains_enabled)
            {
                draw_mountains();
            }

            // --- FORESTS --- 
            if (forests_enabled)
            {
                draw_forests();
            }

            // --- UNITS ---
            for (let unit of selected_player.units)
            {
                if (unit.name === 'settler')
                {
                    draw_settler(unit.x, unit.y);
                }
            }

            // dirty hack for now, should change this once there are more than 2 players
            let other;
            if (selected_player === player) other = enemy;
            else other = player;
            for (let unit of other.units)
            {
                // don't draw unseen enemy units
                if (!hexes[unit.x * rows + unit.y].seen.hasOwnProperty(selected_player.id) ||
                    hexes[unit.x * rows + unit.y].seen[selected_player.id] < 1) continue;

                if (unit.name === 'settler')
                {
                    draw_settler(unit.x, unit.y);
                }
            }

            // ### OVERLAY ###
            gl.clear(gl.DEPTH_BUFFER_BIT);

            // --- BORDERS ---
            // TEST
            draw_region(player.tiles, player.color);
            draw_region(enemy.tiles, enemy.color);
        }

        // ### HUD ###
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shader_program_gui);

        // TEST
        if (test_mouse_over.show)
        {
            let test_verts = [-1, -1, 0, 0, 0, 1, 1,
                              -1, -1.1, 0, 0, 1, 0, 1,
                              -0.9, -1, 0, 1, 0, 0, 1,
                              -0.9, -1, 0, 1, 0, 0, 1,
                              -1, -1.1, 0, 0, 1, 0, 1,
                              -0.9, -1.1, 0, 0, 1, 1, 1];

            // model matrix
            let model = mat4.create();
            model = mat4.translate(model, model, vec3.fromValues(1.02 + test_mouse_over.x, 0.94 + test_mouse_over.y, 0));
            uniform_loc = gl.getUniformLocation(shader_program_gui, 'model');
            gl.uniformMatrix4fv(uniform_loc, gl.FALSE, model);

            gl.bindBuffer(gl.ARRAY_BUFFER, gui_buffer);
            // TODO: remove this from here
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(test_verts), gl.STREAM_DRAW);

            attrib_loc = gl.getAttribLocation(shader_program_gui, 'position');
            gl.enableVertexAttribArray(attrib_loc);
            gl.vertexAttribPointer(attrib_loc, 3, gl.FLOAT, gl.FALSE, 7 * 4, 0);

            attrib_loc = gl.getAttribLocation(shader_program_gui, 'color');
            gl.enableVertexAttribArray(attrib_loc);
            gl.vertexAttribPointer(attrib_loc, 4, gl.FLOAT, gl.FALSE, 7 * 4, 3 * 4);

            gl.drawArrays(gl.TRIANGLES, 0, test_verts.length/7);
        }
    }

    requestAnimationFrame(update_and_render);
}

function main()
{
    gl = initGL();
    ext.instancing = gl.getExtension('ANGLE_instanced_arrays');
    let shaders = initShaders(gl);
    shader_program = shaders['main'];
    shader_program_gui = shaders['gui'];
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
            if (!hex_types_count[hex.type])
            {
                hex_types_count[hex.type] = 0;
            }
            hex_types_count[hex.type] += 1;
            hexes.push(hex);
        }
    }

    // costal sea line
    // TODO: add costal sea line to bounding rows/columns (4 edges of the map)
    for (let j = 0; j < columns; j++) {
        for (let i = 0; i < rows; i++) {
            let hex = hexes[j * rows + i];
            let neighbors = hex_get_neighbors(hex);
            let is_costal = false;

            if (hex.type == 'ocean')
            {
                for (let neighbor of neighbors)
                {
                    if (neighbor.type != 'ocean' && neighbor.type != 'sea')
                    {
                        is_costal = true;
                        break;
                    }
                }
            }

            if (is_costal)
            {
                hex.type = 'sea';
                if (!hex_types_count[hex.type])
                {
                    hex_types_count[hex.type] = 0;
                }
                hex_types_count[hex.type] += 1;
                hex_types_count['ocean'] -= 1;
            }
        }
    }

    camera = {'x': -6, 'y': -2.5, 'z': -2.8, 'speed': 0.004, 'zoom': 1.0};

    // TODO: wait for resources to be loaded before starting to render scene (loading screen)
    load_image('http://i.imgur.com/n7ezMnp.png', function (image) {
        hex_types['forest'][3] = gl.createTexture();
        handle_texture_loaded(image, hex_types['forest'][3], false);
    });

    load_image('http://i.imgur.com/RVZxP2K.png', function (image) {
        hex_types['grassland'][3] = gl.createTexture();
        handle_texture_loaded(image, hex_types['grassland'][3], false);
    });

    load_image('http://i.imgur.com/1mbEioa.png', function (image) {
        hex_types['desert'][3] = gl.createTexture();
        handle_texture_loaded(image, hex_types['desert'][3], false);
    });

    load_image('http://i.imgur.com/3TVWpk4.png', function (image) {
        hex_types['ocean'][3] = gl.createTexture();
        handle_texture_loaded(image, hex_types['ocean'][3], false);
    });

    load_image('http://i.imgur.com/aPPbBbj.png', function (image) {
        hex_types['sea'][3] = gl.createTexture();
        handle_texture_loaded(image, hex_types['sea'][3], false);
    });

    load_image('http://i.imgur.com/TcDOJK5.png', function (image) {
        mountain_model_texture = gl.createTexture();
        handle_texture_loaded(image, mountain_model_texture, true);
    });

    load_image('http://i.imgur.com/nabvSuW.png', function (image) {
        tree_model_texture = gl.createTexture();
        handle_texture_loaded(image, tree_model_texture, true);
    });

    load_image('http://i.imgur.com/qlJxz7J.png', function (image) {
        settler_model_texture = gl.createTexture();
        handle_texture_loaded(image, settler_model_texture, true);
    });

    instance_arrays_of_hexes = create_hexes_instance_arrays(hexes);

    // TODO: fix this, it is dumb
    global_mesh_data = global_mesh_data.meshes[0];
    global_mesh_data2 = global_mesh_data2.meshes[0];
    global_mesh_data3 = global_mesh_data3.meshes[0];

    // create VBOs and EBOs
    grid_indices_buffer = gl.createBuffer();
    grid_tex_coords_buffer = gl.createBuffer();
    grid_shape_buffer = gl.createBuffer();
    mountain_indices_buffer = gl.createBuffer();
    mountain_shape_buffer = gl.createBuffer();
    mountain_tex_coords_buffer = gl.createBuffer();
    forest_indices_buffer = gl.createBuffer();
    forest_shape_buffer = gl.createBuffer();
    settler_indices_buffer = gl.createBuffer();
    settler_shape_buffer = gl.createBuffer();
    settler_tex_coords_buffer = gl.createBuffer();
    // TEST
    region_shape_buffer = gl.createBuffer();
    gui_buffer = gl.createBuffer();

    // upload static data to GPU
    upload_grid_static_data();
    upload_mountain_static_data();
    upload_forest_static_data();
    upload_settler_static_data();

    // TEST
    create_unit(player, 'settler', 40, 40);
    create_unit(player, 'settler', 35, 40);
    selected_unit = player.units[0];
    create_unit(enemy, 'settler', 45, 42);
    create_unit(enemy, 'settler', 42, 42);
    create_unit(enemy, 'settler', 45, 45);
    create_unit(enemy, 'settler', 45, 44);
    create_unit(enemy, 'settler', 42, 43);
    create_unit(enemy, 'settler', 47, 42);
    requestAnimationFrame(update_and_render);
}

function load_image(image_url, callback)
{
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = callback.bind(this, image);
    image.src = image_url;
}

function handle_texture_loaded(image, texture, flip)
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (flip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

main();

