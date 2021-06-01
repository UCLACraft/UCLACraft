import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;

const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

import { coord_to_position, position_to_coord } from './helpers.js'


import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

/*A data structure for multiple blocks processing*/
export default class BlockGroup {
    constructor(blocks) {
        this.blocks = blocks

        this.anchor_coord = this.ComputeAnchor() //the coord for the anchor
        this.relativeCoord = this.getRelativeCoord()
    }

    //get Anchor block coordinate
    //Algorithm: take the central one on x-z plane, take the one with lowest y value
    ComputeAnchor() {
        if (this.blocks.length === 0) {
            return null;
        }
        let minx, minz = Infinity;
        let maxx, maxz = -Infinity;
        let miny = Infinity;
        this.blocks.forEach(element => {
            if (element.coord[0] < minx) {
                minx = element.coord[0];
            }
            if (element.coord[0] > maxx) {
                maxx = element.coord[0];
            }
            if (element.coord[2] < minz) {
                minz = element.coord[2];
            }
            if (element.coord[2] > maxz) {
                maxz = element.coord[2];
            }
            if (element.coord[2] < miny) {
                miny = element.coord[1];
            }
        });
        x_center = Math.round((minx + maxx) / 2);
        z_center = Math.round((minz + maxz) / 2);
        y_center = miny;
        return vec3(x_center, y_center, z_center);
    }

    //get relaive positions w.r.t the anchor
    getRelativeCoord() {
    }

    //return the outline position array
    getOutlines() {

    }

    rotate(counterClockwise = true) {

    }



}