import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

import Block from './Block.js';

import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

import { MousePicking } from './MousePicking.js'



export class UCLACraft_Base extends Scene {

    constructor() {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.shapes = {
            Cube: new Cube(),
        };

        const phong = new defs.Phong_Shader();
        this.materials = {
            plastic: new Material(phong,
                { ambient: .5, diffusivity: .8, specularity: .5, color: color(0.1, 1, 0.1, 1) }),
            metal: new Material(phong,
                { ambient: .5, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1) })
        };

        this.floor = { coordinates: this.getFloorCoordinates(FLOOR_DIM, FLOOR_DIM), coor_x: FLOOR_DIM, coor_z: FLOOR_DIM } //floor: (2*FLOOR_DIM)*(2*FLOOR_DIM)
        this.occupied_coords = [] //list of vec3 that record coordinates of blocks(both real and pseudo)
        this.blocks = []//list of Blocks
        this.next_id = 0 //id counter; increment when a new block is created


        //testing blocks
        this.createBlock(vec3(0, 1, 0));
        this.createBlock(vec3(1, 1, 1));
        this.createBlock(vec3(1, 2, 1));
        this.createBlock(vec3(1, 2, 2));


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


    createBlock(coordinates, shape = this.shapes.Cube, material = this.materials.metal) {
        //check overlap
        this.occupied_coords.forEach(item => {
            if (item.equals(coordinates)) {
                console.log("Failed to place the block");
                return false; //overlap
            }
        });

        this.blocks.push(new Block(shape, coordinates, material, this.next_id)); //coordinates: vec3
        this.occupied_coords.push(coordinates);
        this.next_id++;
        return true
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
            this.children.push(context.scratchpad.mousePicking = new MousePicking());
            console.log(context)
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = program_state.animation_time / 1000;
        const angle = Math.sin(t);
        const light_position = Mat4.rotation(0, 1, 0, 0).times(vec4(0, -1, 1, 0));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
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