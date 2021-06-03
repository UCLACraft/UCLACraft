import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;

const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

import { coord_to_position, position_to_coord } from './helpers.js'


import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

/*A data structure for multiple blocks processing*/

export default class BlockGroup {
    constructor(blocks) { //blocks: array of selected blocks
        this.blocks = blocks
        this.anchor_coord = this.ComputeAnchor() //the coord for the anchor
        this.relativeCoord = this.ComputeRelativeCoord()
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

    //get relaive coordinates w.r.t the anchor
    ComputeRelativeCoord() {
        let res = []
        this.blocks.forEach(element => {
            res.push(element.coord.minus(this.anchor_coord));
        })
        return res;
    }

    //return the outline position array
    getOutlines(cursor_pos) { //cursor_pos: vec3: position of the cursor
        if (cursor_pos === null || cursor_pos === undefined) {
            return [];
        }
        let res = [];
        this.relativeCoord.forEach(element => {
            res.push(vec3(element[0] * BLOCK_SIZE, element[1] * BLOCK_SIZE, element[2] * BLOCK_SIZE).plus(cursor_pos));
        })
        return res;
    }

    //returns an array of block objects to be added
    getMultiBlocks(cursor_coord) {
        let res = []
        this.blocks.forEach((item, i) => {
            item.setCoord(this.relativeCoord[i][0] + cursor_coord[0], this.relativeCoord[i][1] + cursor_coord[1], this.relativeCoord[i][2] + cursor_coord[2]);
            item.model_transform = Mat4.translation(this.position[0], this.position[1], this.position[2]);
            res.push(item);
        })
        return res;
    }

    //rotate 90 degree w.r.t the anchor block
    rotate(counterClockwise = true) {
        this.relativeCoord.forEach((element, i) => {
            if (counterClockwise) {
                let x_coord = this.relativeCoord[i][0];
                this.relativeCoord[i][0] = -this.relativeCoord[i][1];
                this.relativeCoord[i][1] = x_coord;
            } else {
                let x_coord = this.relativeCoord[i][0];
                this.relativeCoord[i][0] = this.relativeCoord[i][1];
                this.relativeCoord[i][1] = -x_coord;
            }
        })
    }



}