// TODO
//
// Features:
// add tile/building/unit selection
// add unit selection and movement with mouse
// introduce turns
// interpolate unit movement between tiles
// add rivers, hills
// add font/text support
// create loading screen
// add lightning/shadowing
// add mouse-controlled camera movement (plus zoom)
// add wrap-around left/right (efficiently)
// create more map gen algorithms
// add multiple-sprite tile animation
// add fallback to GPUs without ANGLE_instace_arrays
// lerp between tiles
// rework seen to account for who is seeing the tile, not only how many times
//
// Maintenance:
// start using static analysis since JS is bad
// maybe rename some usage of hex to tile?
// maybe refactor classes
// start using VAOs
//
// Performance:
// improve ray to hexagon intersection test
// don't draw undiscovered tiles when on not on full_map_revealed mode

// -- constants
let radius = 0.1;
let columns = 140;
let rows = 90;

// -- almost never changing state
let gl;
let canvas;

// -- opengl state
let ext = {};
let shader_program;
let shader_program_gui;
let instance_buffers = {};
let grid_indices_buffer;
let grid_shape_buffer;
let grid_tex_coords_buffer;
let mountain_indices_buffer;
let mountain_shape_buffer;
let mountain_tex_coords_buffer;
let forest_indices_buffer;
let forest_shape_buffer;
let settler_indices_buffer;
let settler_shape_buffer;
let settler_tex_coords_buffer;
// TEST
let region_shape_buffer;
let gui_buffer;

// -- semi-opengl state
// TODO: create an object to hold textures/meshes
let mountain_model_texture;
let tree_model_texture;
let settler_model_texture;
let global_mesh_data;
let global_mesh_data2;
let global_mesh_data3;

// -- engine state
let hexes;
let instance_arrays_of_hexes;
let hex_types_count = {};
let hex_types_current = {};
let last_time = 0;
let key_state = [];
let camera;
let sea_level = 0;
let max_elevations = 3;
let grid_mode = false;
let full_map_revealed = false;
let offset_tex_animation = 0;
// TEST
let forests_enabled = true;
let mountains_enabled = true;
let test_mouse_over = {'moved': false, 'cooldown': 0.3, 'show': false, 'x': 0, 'y': 0, 'candidate_x': 0, 'candidate_y': 0};

// -- game state
let selected_unit = null;
let player = {'id': 0, 'color': {'r': 0, 'g': 1, 'b': 0}, 'tiles': [], 'units': []};
let enemy = {'id': 1, 'color': {'r': 1, 'g': 0, 'b': 0}, 'tiles': [], 'units': []};
let selected_player = player;

// variables regarding instance arrays of hexes
// NOTE: in progress
let hex_types = {
    'grassland': [0.3, 0.9, 0.3, null],
    'forest': [0.0, 0.7, 0.0, null],
    'desert': [1, 1, 0.6, null],
    'sea': [0.3, 0.62, 1.0, null],
    'ocean': [0.2, 0.4, 1, null],
    'mountain': [0.7, 0.7, 0.7, null],
    'ice': [0.5, 0.9, 1, null]
};

window.onkeyup = function(e) {
    key_state[e.key]=false;
}

window.onkeydown = function(e) {
    key_state[e.key]=true;

    // toggle grid mode
    if (e.key === 'g') grid_mode = !grid_mode;

    // toggle full map revealed mode
    if (e.key === 'm') full_map_revealed = !full_map_revealed;

    // toggle forests
    if (e.key === 'f') forests_enabled = !forests_enabled;

    // toggle mountains
    if (e.key === 'h') mountains_enabled = !mountains_enabled;

    // change which player camera to view
    if (e.key === 'p')
    {
        selected_player = (selected_player == player) ? enemy : player;
        instance_arrays_of_hexes = create_hexes_instance_arrays(hexes);
    }

    if (e.key === '1')
    {
        let w = window.innerWidth / 2;
        let h = window.innerHeight / 2;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }

    if (e.key === '2')
    {
        let w = window.innerWidth * 0.67;
        let h = window.innerHeight * 0.67;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }

    if (e.key === '3')
    {
        let w = window.innerWidth;
        let h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }

    if (e.key === '-')
    {
        let w = canvas.width * 0.8;
        let h = canvas.height * 0.8;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }

    // TEST
    if (e.key === '.')
    {
        if (!selected_unit && player.units.length)
        {
            selected_unit = player.units[0];
        }
        else
        {
            selected_unit = player.units[(player.units.indexOf(selected_unit) + 1) % player.units.length];
        }
    }

    // test-only unit movement
    // TODO: check boundaries of map/land
    if (selected_unit !== null)
    {
        if (e.key === 'w')
        {
            move_unit(selected_unit, selected_unit.x, selected_unit.y + 1);
        }

        if (e.key === 'a')
        {
            move_unit(selected_unit, selected_unit.x - 1, selected_unit.y);
        }

        if (e.key === 's')
        {
            move_unit(selected_unit, selected_unit.x, selected_unit.y - 1);
        }

        if (e.key === 'd')
        {
            move_unit(selected_unit, selected_unit.x + 1, selected_unit.y);
        }

        if (e.key === 'b')
        {
            unit_build(selected_unit);
            selected_unit = null;
        }
    }
}

function update_hud()
{
    let z = 1.0;
    let ray_nds = {'x': test_mouse_over.x, 'y': test_mouse_over.y, 'z': z};

    let ray_clip = vec4.fromValues(ray_nds.x, ray_nds.y, -1.0, 1.0);

    // TODO: stop rewriting this
    let projection = mat4.create();
    projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
    projection = mat4.invert(projection, projection);

    let ray_view = vec4.transformMat4(ray_clip, ray_clip, projection);
    ray_view = vec4.fromValues(ray_view[0], ray_view[1], -1.0, 0.0);

    // TODO: stop rewriting this
    let view = mat4.create();
    view = mat4.scale(view, view, vec3.fromValues(1.0 * camera.zoom, 1.0 * camera.zoom, 1.0));
    view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
    view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));
    view = mat4.invert(view, view);

    let temp = vec4.fromValues(0, 0, 0, 0);
    temp = vec4.transformMat4(temp, ray_view, view);
    let ray_world = vec3.fromValues(temp[0], temp[1], temp[2]);
    ray_world = vec3.normalize(ray_world, ray_world);



    let normal = vec3.fromValues(0, 0, 1);
    let camera_origin = vec3.fromValues(-camera.x, -camera.y, -camera.z);

    let divisor = vec3.dot(ray_world, normal);

    // TODO
    //if (vec3.dot(ray_world, normal) == ) handle this being null (does not intersect)

    let t = - (vec3.dot(camera_origin, normal) + 0) / divisor;

    // otherwise intersected behind the view
    let current_tile;
    if (t >= 0) 
    {
        let mouse_loc = vec3.add(camera_origin, camera_origin, vec3.scale(ray_world, ray_world, t));

        for (let i = 0; i < hexes.length; i++)
        {
            let hex = hexes[i];
            if (Math.pow((hex.x - mouse_loc[0]), 2) + Math.pow((hex.y - mouse_loc[1]), 2) < Math.pow(radius, 2))
            {
                current_tile = hex;
                break;
            }
        }
    }

    if (current_tile)
    {
        if (current_tile.seen.hasOwnProperty(selected_player.id) &&
            current_tile.seen[selected_player.id] >= 0)
        {
            test_mouse_over.show = true;
        }
        else
        {
            test_mouse_over.show = false;
        }
    }
}

// TODO: make this more efficient, there are many possible improvements:
// TODO: create a function for raycasting
// -- set a delay between mousemovement checks (this might have to be done outside this listener)
// -- check if mouse is moving or is stopped right now (by using the time from last mouse move)
document.addEventListener('mousemove', function(e) {
    let rect = canvas.getBoundingClientRect();
    let mouse_x = e.clientX - rect.left;
    let mouse_y = e.clientY - rect.top;

    let x = (2.0 * mouse_x) / window.innerWidth - 1.0;
    let y = 1.0 - (2.0 * mouse_y) / window.innerHeight;

    test_mouse_over.moved = true;
    test_mouse_over.candidate_x = x;
    test_mouse_over.candidate_y = y;
    test_mouse_over.show = false;
});

// TODO: handle this inside update? (since I'm using matrixes)
document.addEventListener('mouseup', function(e){
    let rect = canvas.getBoundingClientRect();
    let mouse_x = e.clientX - rect.left;
    let mouse_y = e.clientY - rect.top;

    let x = (2.0 * mouse_x) / window.innerWidth - 1.0;
    let y = 1.0 - (2.0 * mouse_y) / window.innerHeight;
    let z = 1.0;
    let ray_nds = {'x': x, 'y': y, 'z': z};

    let ray_clip = vec4.fromValues(ray_nds.x, ray_nds.y, -1.0, 1.0);

    // TODO: stop rewriting this
    let projection = mat4.create();
    projection = mat4.perspective(projection, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
    projection = mat4.invert(projection, projection);

    let ray_view = vec4.transformMat4(ray_clip, ray_clip, projection);
    ray_view = vec4.fromValues(ray_view[0], ray_view[1], -1.0, 0.0);

    // TODO: stop rewriting this
    let view = mat4.create();
    view = mat4.scale(view, view, vec3.fromValues(1.0 * camera.zoom, 1.0 * camera.zoom, 1.0));
    view = mat4.rotate(view, view, glMatrix.toRadian(-50), vec3.fromValues(1.0, 0.0, 0.0));
    view = mat4.translate(view, view, vec3.fromValues(camera.x, camera.y, camera.z));
    view = mat4.invert(view, view);

    let temp = vec4.fromValues(0, 0, 0, 0);
    temp = vec4.transformMat4(temp, ray_view, view);
    let ray_world = vec3.fromValues(temp[0], temp[1], temp[2]);
    ray_world = vec3.normalize(ray_world, ray_world);



    let normal = vec3.fromValues(0, 0, 1);
    let camera_origin = vec3.fromValues(-camera.x, -camera.y, -camera.z);

    let divisor = vec3.dot(ray_world, normal);

    // TODO
    //if (vec3.dot(ray_world, normal) == ) handle this being null (does not intersect)

    let t = - (vec3.dot(camera_origin, normal) + 0) / divisor;

    // otherwise intersected behind the view
    let clicked_tile;
    if (t >= 0) 
    {
        let click_loc = vec3.add(camera_origin, camera_origin, vec3.scale(ray_world, ray_world, t));

        for (let i = 0; i < hexes.length; i++)
        {
            let hex = hexes[i];
            if (Math.pow((hex.x - click_loc[0]), 2) + Math.pow((hex.y - click_loc[1]), 2) < Math.pow(radius, 2))
            {
                clicked_tile = hex;
                let types = Object.keys(hex_types);
                types.splice(types.indexOf(hex.type), 1);
                let type = types[Math.floor(Math.random()*types.length)]
                if (e.which == 1) change_hex_type(hex, type);
                break;
            }
        }
    }


    // TODO: handle mouse drag to move screen
    if (e.which == 3 && clicked_tile)
    {
        // create area of owned tiles
        let neighbors = hex_get_neighbors(clicked_tile);

        change_tile_owner(clicked_tile, player);
        for (let hex of neighbors)
        {
            change_tile_owner(hex, player);
        }
    }
});

