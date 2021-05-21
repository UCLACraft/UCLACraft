import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:

const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene, Matrix } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Cube_Outline, Textured_Phong, Axis_Arrows } = defs;

import Block from './Block.js';

import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

import { MousePicking } from './MousePicking.js'
import { coord_to_position, position_to_coord } from './helpers.js';


const PLACING = 0;
const MODIFYING = 1;

export class UCLACraft_Base extends Scene {

    constructor() {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.floor = { coordinates: this.getFloorCoordinates(FLOOR_DIM, FLOOR_DIM), coor_x: FLOOR_DIM, coor_z: FLOOR_DIM } //floor: (2*FLOOR_DIM)*(2*FLOOR_DIM)

        this.shapes = {
            Cube: new Cube(),
            BaseCube: new Cube(),
            Cube_Outline: new Cube_Outline(),
            Shadow: new Cube(),
        };

        const phong = new defs.Phong_Shader();
        const texturephong = new defs.Textured_Phong();
        this.materials = {

            plastic: new Material(texturephong,
                {
                    ambient: 1, diffusivity: .8, specularity: .3,
                    texture: new Texture("assets/Grass.jpg", "LINEAR_MIPMAP_LINEAR")
                }),
            metal: new Material(texturephong, {
                ambient: 1, diffusivity: .8, specularity: .8,
                texture: new Texture("assets/RMarble.png", "LINEAR_MIPMAP_LINEAR")
            }),
            ice: new Material(texturephong, {
                ambient: 1, diffusivity: .8, specularity: .2,
                texture: new Texture("assets/CrackedIce.png", "LINEAR_MIPMAP_LINEAR")
            }),
            selected: new Material(phong, {
                ambient: .8, diffusivity: 0.1, specularity: 0,
                color: color(1, 1, 1, 0.2)
            }),
            outline: new Material(new defs.Basic_Shader()),
            shadow: new Material(new Shadow_Shader()),
        };

        this.MouseMonitor = new MousePicking(); //available: this.MouseMonitor.ray
        this.occupied_coords = [] //list of vec3 that record coordinates of blocks(both real and pseudo)
        this.blocks = []//list of Blocks

        this.cursor = undefined; //the block that the mouse is pointing at 

        this.selected = []; //the selected blocks TODO
        this.outlines = []; //outlines: an array indicating outlines positions


        this.state = PLACING; //can be one of two states: PLACING/MODIFYING

        this.mouse_control_added = false;

        this.dummyBlock = new Block(this.shapes.Cube, vec3(0, 0, 0)); //a dummy block used for placing blocks on the floor
        //testing blocks

        this.createBlock(vec3(0, 1, 0));
        this.createBlock(vec3(1, 1, 1));
        this.createBlock(vec3(1, 2, 1));
        this.createBlock(vec3(1, 2, 2));
        this.parity = false;
        this.flipMaterial();
        this.currentMaterial = this.materials.metal;



    }

    add_mouse_controls(canvas) {
        canvas.addEventListener("click", () => {
            if (this.state === PLACING) {
                this.outlines.forEach((outline_pos, i) => {
                    this.createBlock(position_to_coord(outline_pos));
                })
                this.outlines = [];
            } else { //MODIFYING
                return; //TODO
            }
        });
    }
    //return a list of vec3 indicating the floor coordinates (all at y=0)
    getFloorCoordinates(x, z) {
        let res = new Array((2 * x) * 2 * z)
        let c = 0
        for (let i = -x; i < x; i++) {
            for (let j = -z; j < z; j++) {
                res[c] = vec3(i, 0, j);
                c++;
            }
        }
        //console.log(res);
        return res;

    }
    //algorithm: ray-sphere intersection: https://antongerdelan.net/opengl/raycasting.html
    //returns the t if the ray goes thru the imaginary sphere
    //otherwise, return null
    ray_block_intersects(ray, blockPos, cam_pos) {
        let shift = cam_pos.minus(blockPos);
        let b = ray.dot(shift);
        let c = shift.dot(shift) - ((BLOCK_SIZE / 2) * Math.sqrt(2)) ** 2;
        if (b ** 2 - c > 0) {
            return Math.min(-b + Math.sqrt(b ** 2 - c), -b - Math.sqrt(b ** 2 - c)); //choose the smaller solution
        }
        return null;
    }
    //modify this.dummy that overlaps with the floor IF the ray goes thru the floor
    intersectFloor(program_state) {
        let ray = this.MouseMonitor.ray;
        let cam_pos = program_state.camera_transform.times(vec4(0, 0, 0, 1)).to3();
        let t = (1 - cam_pos[1]) / (ray[1]);
        let pos = cam_pos.plus(ray.times(t));
        let x_coord = Math.round(position_to_coord(pos)[0]);
        let z_coord = Math.round(position_to_coord(pos)[2]);
        if (x_coord < -FLOOR_DIM / 2 || x_coord > FLOOR_DIM / 2 || z_coord < -FLOOR_DIM / 2 || z_coord > FLOOR_DIM / 2) {
            return false; //out of range
        }

        this.dummyBlock.setCoord(x_coord, 0, z_coord);
        return true;
    }
    //returns an array of block positions around the input block 
    getOutlineCandidates(block, floor = false) {
        let coordinate = block.coord;
        let res;
        if (!floor) {
            res = [vec3(coordinate[0] + 1, coordinate[1], coordinate[2]), vec3(coordinate[0] - 1, coordinate[1], coordinate[2]),
            vec3(coordinate[0], coordinate[1] + 1, coordinate[2]), vec3(coordinate[0], coordinate[1] - 1, coordinate[2]),
            vec3(coordinate[0], coordinate[1], coordinate[2] + 1), vec3(coordinate[0], coordinate[1], coordinate[2] - 1)];
        } else {
            res = [vec3(coordinate[0], coordinate[1] + 1, coordinate[2])];
        }

        return res.map(item => coord_to_position(item));
    }


    placeGroundShadow(context, program_state, block_position, light_position, sample_rate) { //TODO: DYNAMIC CALCULATION ACCORDING TO LIGHT SOURCE && REWRITE RAY CASTING FUNCTION
        for (let x = -32; x < 33; x += sample_rate) {
            for (let z = -32; z < 33; z += sample_rate) {
                let ground_point = vec3(x, 1, z);
                let ray = light_position.minus(vec3(x, 1, z)); //VECTOR FROM GROUND POINT TO LIGHT POINT
                let blocked = false;
                let ray_x, ray_y, ray_z;
                for (let t = 0; t < 1; t += 0.02) { //TEST IF ANY POINT IN THE RAY IN INSIDE A CUBE
                    ray_x = ground_point[0] + t * ray[0];
                    ray_y = ground_point[1] + t * ray[1];
                    ray_z = ground_point[2] + t * ray[2];
                    if (ray_x <= block_position[0] + 1 && ray_x >= block_position[0] - 1 &&
                        ray_y <= block_position[1] + 1 && ray_y >= block_position[1] - 1 &&
                        ray_z <= block_position[2] + 1 && ray_z >= block_position[2] - 1) { //block position return the center of the block, and the block volume is defined by +-1
                        blocked = true;
                        break;
                    }
                }
                if (blocked) {
                    this.shapes.Shadow.draw(context, program_state, Mat4.identity().
                        times(Mat4.translation(x - sample_rate / 4, 1, z - sample_rate / 4)).times(Mat4.scale(sample_rate / 2, 0.01, sample_rate / 2)), this.materials.shadow);
                    // let translation = Mat4.identity().times(Mat4.translation(x,1,z)).times(Mat4.scale(1,0.1,1));
                    // this.shapes.Shadow.draw(context,program_state,translation,this.materials.shadow);
                }
            }
        }
    }

    //update this.cursor
    //update this.outlines
    getPointing_at(program_state) {

        /*get this.cursor */
        let ray = this.MouseMonitor.ray;
        if (ray === undefined) {
            return;
        }

        let min_t = Infinity;
        let min_block = undefined;

        this.blocks.forEach(item => {
            let curr = this.ray_block_intersects(ray, item.position, program_state.camera_transform.times(vec4(0, 0, 0, 1)).to3())
            if (curr !== null) {
                if (curr < min_t) {
                    min_t = curr;
                    min_block = item;
                }
            }
        })
        if (min_block !== undefined) {
            this.cursor = min_block;

        } else { //if pointing at nothing, clear this.outlines and this.cursor
            this.outlines = [];
            this.cursor = undefined;
        }
        // if (this.selected.length !== 0) {
        //     console.log(this.selected);
        // }

        /*get this.outlines*/
        if (this.state === PLACING) {
            let new_outlines = []
            if (min_block !== undefined || this.intersectFloor(program_state)) {
                const candidates = (min_block !== undefined) ? this.getOutlineCandidates(min_block) : this.getOutlineCandidates(this.dummyBlock, true);

                let outline_pos = undefined;
                let min_t = Infinity;
                candidates.forEach(candidate => {
                    let curr = this.ray_block_intersects(ray, candidate, program_state.camera_transform.times(vec4(0, 0, 0, 1)).to3())
                    if (curr !== null) {
                        if (curr < min_t) {
                            min_t = curr;
                            outline_pos = candidate;
                        }
                    }
                })
                if (outline_pos !== undefined) {
                    new_outlines.push(outline_pos);
                    this.outlines = new_outlines;
                }
            }
        }
    }
    drawOutline(context, program_state) {
        //draw outline
        this.outlines.forEach(outline => {
            this.shapes.Cube_Outline.draw(context, program_state, Mat4.translation(outline[0], outline[1], outline[2]), this.materials.outline, "LINES");
        })
    }
    drawSelected(context, program_state) {
        this.selected.forEach(selected => {
            this.shapes.Cube.draw(context, program_state, selected.model_transform.times(Mat4.scale(1.01, 1.01, 1.01)), this.materials.selected);

        });
    }
    drawCursor(context, program_state) {
        if (this.cursor !== undefined) {
            this.shapes.Cube.draw(context, program_state, this.cursor.model_transform.times(Mat4.scale(1.01, 1.01, 1.01)), this.materials.selected);
        }
    }
    createBlock(coordinates, shape = this.shapes.Cube, material = this.currentMaterial) {
        //check overlap
        this.occupied_coords.forEach(item => {
            if (item.equals(coordinates)) {
                console.log("Failed to place the block");
                return false; //overlap
            }
        });

        this.blocks.push(new Block(shape, coordinates, material, this.next_id)); //coordinates: vec3
        this.occupied_coords.push(coordinates);
        return true
    }
    flipMaterial() {
        if (this.parity) {
            this.blocks.forEach(block => {
                block.setTexture(this.materials.plastic)
            })
        } else {
            this.blocks.forEach(block => {
                block.setTexture(this.materials.metal)
            })
        }
        this.parity = !this.parity
    }
    toIce() {
        this.currentMaterial = this.materials.ice;
    }
    toMetal() {
        this.currentMaterial = this.materials.metal;
    }
    toGround() {
        this.currentMaterial = this.materials.plastic;
    }
    make_control_panel() {
        // make_control_panel(): Sets up a panel of interactive HTML elements, including
        // buttons with key bindings for affecting this scene, and live info readouts.
        // this.control_panel.innerHTML += "Dragonfly rotation angle: ";
        // // The next line adds a live text readout of a data member of our Scene.
        // this.live_string(box => {
        //     box.textContent = (this.hover ? 0 : (this.t % (2 * Math.PI)).toFixed(2)) + " radians"
        // });
        // this.new_line();
        // this.new_line();
        // // Add buttons so the user can actively toggle data members of our Scene:
        // this.key_triggered_button("Hover dragonfly in place", ["h"], function () {
        //     this.hover ^= 1;
        // });
        // this.new_line();
        // this.key_triggered_button("Swarm mode", ["m"], function () {
        //     this.swarm ^= 1;
        // });
        super.make_control_panel();
        this.key_triggered_button("Change All to Marble/Grass", ["Control", "c"], () => this.flipMaterial());
        this.new_line()
        this.key_triggered_button("Change Texture to Ice", ["Control", "i"], () => this.toIce());
        this.key_triggered_button("Change Texture to Marble", ["Control", "m"], () => this.toMetal());
        this.key_triggered_button("Change Texture to Grass", ["Control", "g"], () => this.toGround());
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Transforms_Sandbox, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());


            // Define the global camera and projection matrices, which are stored in program_state.  The camera
            // matrix follows the usual format for transforms, but with opposite values (cameras exist as
            // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
            // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
            // orthographic() automatically generate valid matrices for one.  The input arguments of
            // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.
            let camera_pos = Mat4.translation(0, 3, 10);

            program_state.set_camera(Mat4.inverse(camera_pos));
        }

        if (!context.scratchpad.mousePicking) {
            this.children.push(context.scratchpad.mousePicking = this.MouseMonitor);
            console.log(context)
        }

        if (!this.mouse_control_added) {
            this.add_mouse_controls(context.canvas);
            this.mouse_control_added = true;
        }


        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = program_state.animation_time / 1000;
        const angle = Math.sin(t);
        const light_position = vec4(1 + 5 * angle, 20, 5, 0);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        //if (this.blocks.length) 5->0.2 10->0.4 20->0.5 50->0.75 else->0.8
        let sample_rate = 0.23 * Math.log(this.blocks.length + 2) - 0.15;
        if (this.blocks.length >= 75) { sample_rate = 1.2; }
        else if (this.blocks.length >= 100) { sample_rate = 2; }
        this.blocks.forEach(item => this.placeGroundShadow(context, program_state, item.position, light_position.to3(), sample_rate));
    }

}


export class UCLACraft extends UCLACraft_Base {

    display(context, program_state) {

        // Call the setup code that we left inside the base class:
        super.display(context, program_state);
        const t = this.t = program_state.animation_time / 1000;

        const blue = hex_color("#1a9ffa"), yellow = hex_color("#fdc03a")
        // Variable model_transform will be a local matrix value that helps us position shapes.
        // It starts over as the identity every single frame - coordinate axes at the origin.
        // let model_transform = Mat4.identity();

        // model_transform = model_transform.times(Mat4.translation(0, 0, 0));
        // // Draw the top box:
        // this.shapes.Cube.draw(context, program_state, model_transform, this.materials.plastic.override(blue));
        this.drawfloor(context, program_state);
        this.drawBlocks(context, program_state);

        this.getPointing_at(program_state); //fill in this.selected this.outlines

        this.drawSelected(context, program_state);//draw selected
        this.drawCursor(context, program_state);//draw cursor
        this.drawOutline(context, program_state); //draw outlines
    }

    drawfloor(context, program_state) {
        let model_transform = Mat4.scale(this.floor.coor_x, 1, this.floor.coor_z);
        this.shapes.Cube.draw(context, program_state, model_transform, this.materials.plastic);
    }

    drawBlocks(context, program_state) {
        this.blocks.forEach(block => {
            block.draw(context, program_state);
        });
    }


}

class Shadow_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        return this.shared_glsl_code() + `
        void main(){
            gl_FragColor = vec4( 0.35, 0.63, 0.15, 1);
        }`;
    }
}