import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

import { coord_to_position, position_to_coord } from './helpers.js'


import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

export default class Block {
    constructor(shape, coord, material, block_id) {
        this.shape = shape;
        this.coord = coord; //vec3 indicating coord
        this.position = coord_to_position(this.coord); //vec3: position
        this.material = material;
        this.model_transform = Mat4.translation(this.position[0], this.position[1], this.position[2]);
        this.block_id = block_id;
    }

    //draw the block
    draw(context, program_state, model_transform = this.model_transform) {
        this.shape.draw(context, program_state, model_transform, this.material);
    }

    getCoord() {
        return this.coord;
    }

    getPosition() {
        return this.position;
    }

    getID() {
        return this.block_id;
    }

    getTransformMatrix() {
        return this.model_transform;
    }

    //whether the block is floor
    is_terrain() {
        return true;
    }

    //whether a vector passes through the block
    //ray: vec4
    pass_thru(ray) {
        return true;
    }


}

