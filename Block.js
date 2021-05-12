import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

export default class Block {
    constructor(shape, position, material, context, program_state, block_id) {
        this.shape = shape;
        this.position = position; //vec3 indicating position
        this.material = material;
        this.context = context;
        this.program_state = program_state;
        this.model_transform = Mat4.translation(position[0], position[1], position[2])
        this.block_id = block_id;
    }

    //draw the block
    draw() {
        this.shape.draw(this.context, this.program_state, this.model_transform, this.material);
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

