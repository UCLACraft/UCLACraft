import { defs, tiny } from './examples/common.js';
import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;


//helper functions
//convert coord_to_position
//input: vec3:coordinates
function coord_to_position(coordinates) {
    return vec3(coordinates[0] * BLOCK_SIZE, coordinates[1] * BLOCK_SIZE, coordinates[2] * BLOCK_SIZE);
}

function position_to_coord(position) {
    //note: position/BLOCK_SIZE may lead to non-integer, so we choose the closest integer
    return vec3(Math.round(position[0] / BLOCK_SIZE), Math.round(position[1] / BLOCK_SIZE), Math.round(position[2] / BLOCK_SIZE));
}

export { coord_to_position, position_to_coord }
