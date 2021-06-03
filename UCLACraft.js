import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:

const { vec, vec3, vec4, color, Color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene, Matrix } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Cube_Outline, Textured_Phong, Axis_Arrows } = defs;

import Block from './Block.js';

import { BLOCK_SIZE, FLOOR_DIM } from './Constants.js'

import { MousePicking } from './MousePicking.js'
import { coord_to_position, position_to_coord } from './helpers.js';

import {
    Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE
} from './shadow-demo-shaders.js'

const PLACING = 0;
const MODIFYING = 1;

const Square_1 =
    class Square extends tiny.Vertex_Buffer {
        constructor() {
            super("position", "normal", "texture_coord");
            this.arrays.position = [
                vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0),
                vec3(1, 1, 0), vec3(1, 0, 0), vec3(0, 1, 0)
            ];
            this.arrays.normal = [
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
            ];
            this.arrays.texture_coord = [
                vec(0, 0), vec(1, 0), vec(0, 1),
                vec(1, 1), vec(1, 0), vec(0, 1)
            ]
        }
    }

export class UCLACraft_Base extends Scene {

    constructor() {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.floor = { coordinates: this.getFloorCoordinates(FLOOR_DIM, FLOOR_DIM), coor_x: FLOOR_DIM, coor_z: FLOOR_DIM } //floor: (2*FLOOR_DIM)*(2*FLOOR_DIM)

        this.shapes = {
            Cube: new Cube(),
            BaseCube: new Cube(),
            Cube_Outline: new Cube_Outline(),
            Shadow: new Cube(),
            Bright: new defs.Subdivision_Sphere(6),
            Sun: new defs.Subdivision_Sphere(6),
            box: new Cube(),
            Moon: new defs.Subdivision_Sphere(6),
            Windmill: new Windmill(),
            square_2d: new Square_1(),
        };

        const phong = new defs.Phong_Shader();
        const texturephong = new defs.Textured_Phong();
        const shadow_shader = new Shadow_Textured_Phong_Shader(10)

        this.materials = {
            grass: new Material(shadow_shader,
                {
                    ambient: 1, diffusivity: .8, specularity: .3,
                    texture: new Texture("assets/Grass.jpg")
                }),
            bamboo_wall: new Material(new defs.Fake_Bump_Map, {
                ambient: 1, diffusivity: 1, specularity: .3,
                texture: new Texture("assets/BambooWall.png", "LINEAR_MIPMAP_LINEAR"),
            }),
            plastic: new Material(texturephong, {
                color: color(.5, .5, .5, 1),
                ambient: .4, diffusivity: .5, specularity: .5,
                color_texture: new Texture("assets/Grass.jpg"),
                light_depth_texture: null
            }),
            metal: new Material(shadow_shader, {
                color: color(.5, .5, .5, 1),
                ambient: .4, diffusivity: .5, specularity: .5,
                color_texture: new Texture("assets/RMarble.png"),
                light_depth_texture: null
            }), //TODO: CHANGE REMAINING
            ice: new Material(shadow_shader, {
                color: color(.5, .5, .5, 1),
                ambient: .7, diffusivity: .5, specularity: .5,
                color_texture: new Texture("assets/CrackedIce.png"),
                light_depth_texture: null
            }),
            //             sun: new Material(new defs.Phong_Shader(),
            //                 {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#f35a38")}),
            sun: new Material(texturephong,
                {
                    ambient: 1, diffusivity: 0.5, specularity: .5,
                    texture: new Texture('assets/sun.gif', 'LINEAR_MIPMAP_LINEAR')
                }),

            moon: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#dceff5") }),
            cube_light: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#fde79a") }),
            selected: new Material(phong, {
                ambient: .8, diffusivity: 0.1, specularity: 0,
                color: color(1, 1, 1, 0.2),
            }),
            outline: new Material(new defs.Basic_Shader()),
            shadow: new Material(new Shadow_Shader()),
            Bright: new Material(new Bright_Shader()),
            VeryBright: new Material(new Very_Bright_Shader()),
            down: new Material(texturephong,
                {
                    texture: new Texture("assets/negy.jpg"),
                    ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(0, 0, 0, 1)
                }),

            right: new Material(texturephong,
                {
                    texture: new Texture("assets/posx.jpg"),
                    ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(0, 0, 0, 1)
                }),
            back: new Material(texturephong,
                {
                    texture: new Texture("assets/posz.jpg"),
                    ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(0, 0, 0, 1)
                }),
            left: new Material(texturephong,
                {
                    texture: new Texture("assets/negx.jpg"),
                    ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(0, 0, 0, 1)
                }),
            front: new Material(texturephong,
                {
                    texture: new Texture("assets/negz.jpg"),
                    ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(0, 0, 0, 1)
                }),
            up: new Material(texturephong,
                {
                    texture: new Texture("assets/posy.jpg"),
                    ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(0, 0, 0, 1)
                })
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

        //this.createBlock(vec3(0, 1, 0));
        // this.createBlock(vec3(1, 1, 1));
        // this.createBlock(vec3(1, 2, 1));
        // this.createBlock(vec3(1, 2, 2));
        this.parity = false;
        this.flipMaterial();
        this.currentMaterial = this.materials.metal;


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        this.materials.stars = new Material(shadow_shader, {
            color: color(.5, .5, .5, 1),
            ambient: .8, diffusivity: .5, specularity: .5,
            color_texture: new Texture("assets/RMarble.png"),
            light_depth_texture: null
        });

        // For the floor or other plain objects
        this.materials.floor = new Material(shadow_shader, {
            color: color(.5, .5, .5, 1),
            ambient: .4, diffusivity: .5, specularity: .5,
            color_texture: new Texture("assets/GroundMud.png", "LINEAR_MIPMAP_LINEAR"),
            light_depth_texture: null
        })
        // For the first pass
        this.pure = new Material(new Color_Phong_Shader(), {
        })
        // For light source
        this.light_src = new Material(new defs.Phong_Shader(), {
            color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
        });
        // For depth texture display
        this.depth_tex = new Material(new Depth_Texture_Shader_2D(), {
            color: color(0, 0, .0, 1),
            ambient: 1, diffusivity: 0, specularity: 0, texture: null
        });

        // To make sure texture initialization only does once
        this.init_ok = false;
    }

    add_mouse_controls(canvas) {
        canvas.addEventListener("click", () => {
            if (this.state === PLACING) {
                this.outlines.forEach((outline_pos, i) => {
                    this.createBlock(position_to_coord(outline_pos));
                })
                this.outlines = [];
            } else { //MODIFYING
                //if clicked, add the block to this.selected if it's in there; remove it from this.selected if it's not in there
                if (this.cursor === undefined) {
                    return;
                } else {
                    let found = false;
                    this.selected.forEach((item, i) => {
                        if (this.cursor === item) {
                            this.selected.splice(i, 1);
                            found = true;
                            return;
                        }
                    })
                    if (!found) {
                        this.selected.push(this.cursor);
                    }
                }
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
    //get distance
    distance(x1, y1, z1, x2, y2, z2) {
        return ((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2) ** 0.5;
    }

    placeGroundShadow(context, program_state, block_position, light_position, sample_rate, moonlight_position) { //TODO: DYNAMIC CALCULATION ACCORDING TO LIGHT SOURCE && REWRITE RAY CASTING FUNCTION
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
                    let appear = true;
                    for (let i = 1; i < program_state.lights.length; i++) {
                        let light = program_state.lights[i].position;
                        if (this.distance(x, 1, z, 2 * light[0], light[1], 2 * light[2]) < 4) {
                            appear = false;
                            break;
                        }
                    }
                    if (appear) {
                        this.shapes.Shadow.draw(context, program_state, Mat4.identity().
                            times(Mat4.translation(x - sample_rate / 4, 1, z - sample_rate / 4)).times(Mat4.scale(sample_rate / 2, 0.01, sample_rate / 2)), this.materials.shadow);
                    }
                }
            }
        }
        for (let x = -32; x < 33; x += sample_rate) {
            for (let z = -32; z < 33; z += sample_rate) {
                let ground_point = vec3(x, 1, z);
                let ray = moonlight_position.minus(vec3(x, 1, z)); //VECTOR FROM GROUND POINT TO LIGHT POINT
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
                    let appear = true;
                    for (let i = 1; i < program_state.lights.length; i++) {
                        let light = program_state.lights[i].position;
                        if (this.distance(x, 1, z, 2 * light[0], light[1], 2 * light[2]) < 4) {
                            appear = false;
                            break;
                        }
                    }
                    if (appear) {
                        this.shapes.Shadow.draw(context, program_state, Mat4.identity().
                            times(Mat4.translation(x - sample_rate / 4, 1, z - sample_rate / 4)).times(Mat4.scale(sample_rate / 2, 0.01, sample_rate / 2)), this.materials.shadow);
                    }
                }
            }
        }

    }

    placeGroundLighting(context, program_state) {
        for (let i = 1; i < program_state.lights.length; i++) {
            let position = program_state.lights[i].position
            let radius = (10 - position[1] ** 2) ** 0.5;
            let radius2 = (7 - position[1] ** 2) ** 0.5;
            this.shapes.Bright.draw(context, program_state, Mat4.translation(position[0], 2, position[2]).times(Mat4.scale(radius, 0.01, radius)), this.materials.Bright)
            this.shapes.Bright.draw(context, program_state, Mat4.translation(position[0], 2, position[2]).times(Mat4.scale(radius2, 0.01, radius2)), this.materials.VeryBright)
        }
    }

    addNightEffect(context, program_state, sun_position) {
        let factor = (sun_position / 68) / 2 //from -0.25 to 0.25

        this.materials.stars.ambient = 0.5 + factor
        this.materials.ice.ambient = 0.35 + factor
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

    deleteBlock(block) {
        this.blocks.forEach((item, i) => {
            if (block === item) {
                this.blocks.splice(i, 1);
            }
        })
    }

    deleteSelected() {
        if (this.state !== MODIFYING) {
            window.alert("Error!");
        } else {
            this.selected.forEach((item, i) => {
                this.deleteBlock(item);
            })
            this.selected = [];
        }
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
        if (this.state === MODIFYING) {
            this.selected.forEach((item, i) => {
                item.material = this.materials.ice;
            })
            this.selected = [];
        }
    }
    toMetal() {
        this.currentMaterial = this.materials.stars;
        if (this.state === MODIFYING) {
            this.selected.forEach((item, i) => {
                item.material = this.materials.stars;

            })
            this.selected = [];
        }
    }
    toGround() {
        this.currentMaterial = this.materials.grass;
        if (this.state === MODIFYING) {
            this.selected.forEach((item, i) => {
                item.material = this.materials.grass;
            })
            this.selected = [];
        }
    }
    toLight() {
        this.currentMaterial = this.materials.cube_light;
        if (this.state === MODIFYING) {
            this.selected.forEach((item, i) => {
                item.material = this.materials.cube_light;
            })
            this.selected = [];
        }
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
        this.key_triggered_button("Change Texture to Light", ["Control", "l"], () => this.toLight());
        this.key_triggered_button("Switch State", ["Enter"], () => {
            if (this.state === MODIFYING) {
                this.state = PLACING;
            } else {
                this.state = MODIFYING;
                this.outlines = [];
            }
        });
        this.key_triggered_button("Delete", ["Backspace"], () => { if (this.state === MODIFYING) this.deleteSelected(); });
    }

    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.materials.stars.light_depth_texture = this.light_depth_texture
        this.materials.floor.light_depth_texture = this.light_depth_texture

        Object.values(this.materials).forEach(element => {
            element.light_depth_texture = this.light_depth_texture;
        })

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render_scene(context, program_state, shadow_pass, draw_light_source = false, draw_shadow = false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time / 1000;

        program_state.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            this.shapes.Sun.draw(context, program_state,
                Mat4.translation(Math.cos(t / 20) * 34, Math.sin(t / 20) * 34, 5).times(Mat4.scale(1, 1, 1)),
                this.light_src.override({ color: light_color }));
        }

        // for (let i of [-1, 1]) { // Spin the 3D model shapes as well.
        //     const model_transform = Mat4.translation(2 * i, 3, 0)
        //         .times(Mat4.rotation(t / 1000, -1, 2, 0))
        //         .times(Mat4.rotation(-Math.PI / 2, 1, 0, 0));
        //     this.shapes.teapot.draw(context, program_state, model_transform, shadow_pass? this.stars : this.pure);
        // }

        //draw floor
        let model_transform = Mat4.scale(this.floor.coor_x, 1, this.floor.coor_z);
        this.shapes.Cube.draw(context, program_state, model_transform, shadow_pass ? this.materials.floor : this.pure);


        this.blocks.forEach(item => {
            if (item.material !== this.materials.cube_light) {
                let material = shadow_pass ? item.material : this.pure;
                item.draw(context, program_state, material, item.model_transform)
            } else {
            }
        })
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Transforms_Sandbox, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.
        const gl = context.context;
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.look_at(
                vec3(0, 12, 12),
                vec3(0, 2, 0),
                vec3(0, 1, 0)
            )); // Locate the camera here
        }

        if (!context.scratchpad.mousePicking) {
            this.children.push(context.scratchpad.mousePicking = this.MouseMonitor);
            //console.log(context)
        }

        if (!this.mouse_control_added) {
            this.add_mouse_controls(context.canvas);
            this.mouse_control_added = true;
        }

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 500);

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = program_state.animation_time / 1000;
        const light_position = vec4(Math.cos(t / 20) * 34, Math.sin(t / 20) * 34, 5, 0);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];
        const moonlight_position = vec4(Math.cos(t / 20 + Math.PI) * 40, Math.sin(t / 20 + Math.PI) * 40, 5, 0);
        //program_state.lights = [new Light(moonlight_position, color(1, 1, 1, 1), 10000)]; //TODO: check
        this.shapes.Moon.draw(context, program_state, Mat4.translation(Math.cos(t / 20 + Math.PI) * 40, Math.sin(t / 20 + Math.PI) * 40, 5).times(Mat4.scale(3, 3, 3)), this.materials.moon)
        //place the light source is there is a block that is a light
        this.blocks.forEach(item => {
            if (item.material === this.materials.cube_light) {
                //console.log(item.coord)
                let light = item.coord
                program_state.lights.push(new Light(vec4(light[0] * 2, light[1] * 2, light[2] * 2, 0), color(1, 1, 1, 1), 5))
            }
        });
        //add lighting effect to the floor
        //this.placeGroundLighting(context, program_state);

        //if (this.blocks.length) 5->0.2 10->0.4 20->0.5 50->0.75 else->0.8
        // let sample_rate = 0.23 * Math.log(this.blocks.length + 2) - 0.16;
        // if (this.blocks.length >= 75) { sample_rate = 1.2; }
        // else if (this.blocks.length >= 100) { sample_rate = 2; }
        // this.blocks.forEach(item => {
        //     if (item.material !== this.materials.cube_light) {
        //         this.placeGroundShadow(context, program_state, item.position, light_position.to3(), sample_rate,moonlight_position.to3())
        //     }
        // });

        // this.addNightEffect(context, program_state, Math.sin(t/20)*40, light_position)
        //const light_position = vec4(Math.cos(t / 20) * 20, Math.sin(t / 20) * 20, 5, 0);
        //program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];
        //this.shapes.Sun.draw(context, program_state, Mat4.translation(Math.cos(t/20)*40, Math.sin(t/20)*40, 5).times(Mat4.scale(3,3,3)), this.materials.sun)

        // The position of the light
        this.light_position = light_position;
        // The color of the light
        // this.light_color = color(
        //     0.667 + Math.sin(t * 2) / 3,
        //     0.667 + Math.sin(t * 1000 / 1500) / 3,
        //     0.667 + Math.sin(t * 1000 / 3500) / 3,
        //     1)
        if (light_position[1] < 1) {
            this.light_color = color(0, 0, 0, 1);
        } else {
            this.light_color = color(1, 1, 1, 1);
        }

        this.addNightEffect(context, program_state, light_position[1])

        // This is a rough target of the light.
        // Although the light is point light, we need a target to set the POV of the light
        this.light_view_target = vec4(0, 0, 0, 1);
        this.light_field_of_view = 120 * Math.PI / 180.0; // 130 degree
        //program_state.lights = [new Light(this.light_position, this.light_color, 15000)];

        // Step 1: set the perspective and camera to the POV of light
        const light_view_mat = Mat4.look_at(
            vec3(this.light_position[0], this.light_position[1], this.light_position[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0) // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 5, 10000);
        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
        program_state.light_view_mat = light_view_mat;
        program_state.light_proj_mat = light_proj_mat;
        program_state.light_tex_mat = light_proj_mat;
        program_state.view_mat = light_view_mat;
        program_state.projection_transform = light_proj_mat;
        this.render_scene(context, program_state, false, false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 10000);
        this.render_scene(context, program_state, true, true, true);

        // // Step 3: display the textures
        // this.shapes.square_2d.draw(context, program_state,
        //     Mat4.translation(-.99, .08, 0).times(
        //         Mat4.scale(0.5, 0.5 * gl.canvas.width / gl.canvas.height, 1)
        //     ),
        //     this.depth_tex.override({ texture: this.lightDepthTexture })
        // );

        this.blocks.forEach(item => {
            if (item.material === this.materials.cube_light) {
                item.draw(context, program_state, item.material, item.model_transform)
                let radius = (6 - item.coord[1] ** 2) ** 0.5;
                let radius2 = (4 - item.coord[1] ** 2) ** 0.5;
                this.shapes.Bright.draw(context, program_state, Mat4.translation(item.coord[0] * 2, 1, item.coord[2] * 2).times(Mat4.scale(radius, 0.01, radius)), this.materials.Bright)
                this.shapes.Bright.draw(context, program_state, Mat4.translation(item.coord[0] * 2, 1.01, item.coord[2] * 2).times(Mat4.scale(radius2, 0.01, radius2)), this.materials.VeryBright)
            }
        })
    }
}



export class UCLACraft extends UCLACraft_Base {



    createScene(context, program_state) {

        const t = this.t = program_state.animation_time / 1000;
        let temp_ambient = 0.5 + 0.5 * Math.sin(t / 20);
        let model_transform = Mat4.identity();

        /// *********  BACKGROUND SCENE *********
        //Create a scene
        let sky_transform = Mat4.identity();


        //floor
        sky_transform = Mat4.identity();
        sky_transform = sky_transform.times(Mat4.translation(0, -2, 0));
        sky_transform = sky_transform.times(Mat4.scale(50, 0.2, 50));
        this.shapes.box.draw(context, program_state, sky_transform, this.materials.down.override({ ambient: temp_ambient }));

        //ceiling
        sky_transform = Mat4.identity();


        sky_transform = sky_transform.times(Mat4.translation(0, 50, 0));
        sky_transform = sky_transform.times(Mat4.scale(50, 0.2, 50));
        this.shapes.box.draw(context, program_state, sky_transform, this.materials.up.override({ ambient: temp_ambient }));

        //right wall 
        sky_transform = Mat4.identity();


        sky_transform = sky_transform.times(Mat4.translation(50, 0, 0));
        sky_transform = sky_transform.times(Mat4.scale(0.2, 50, 50));
        this.shapes.box.draw(context, program_state, sky_transform, this.materials.right.override({ ambient: temp_ambient }));

        //left wall 
        sky_transform = Mat4.identity();


        sky_transform = sky_transform.times(Mat4.translation(-50, 0, 0));
        sky_transform = sky_transform.times(Mat4.scale(0.2, 50, 50));
        this.shapes.box.draw(context, program_state, sky_transform, this.materials.left.override({ ambient: temp_ambient }));

        //back wall 
        sky_transform = Mat4.identity();


        sky_transform = sky_transform.times(Mat4.translation(0, 0, -50));
        sky_transform = sky_transform.times(Mat4.scale(50, 50, 0.2));
        this.shapes.box.draw(context, program_state, sky_transform, this.materials.back.override({ ambient: temp_ambient }));

        //front wall 
        sky_transform = Mat4.identity();

        sky_transform = sky_transform.times(Mat4.translation(0, 0, 50));
        sky_transform = sky_transform.times(Mat4.scale(50, 50, 0.2));
        this.shapes.box.draw(context, program_state, sky_transform, this.materials.front.override({ ambient: temp_ambient }));

        /// ********* END BACKGROUND SCENE *********


    }


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
        // this.drawfloor(context, program_state);

        //this.drawfloor(context, program_state);

        this.getPointing_at(program_state); //fill in this.selected this.outlines

        this.drawSelected(context, program_state);//draw selected
        this.drawCursor(context, program_state);//draw cursor
        this.drawOutline(context, program_state); //draw outlines
        this.createScene(context, program_state);
        this.drawWindMills(context, program_state);

    }

    drawWindMills(context, program_state) {
        let model_transform = Mat4.scale(10, 10, 10);
        model_transform = model_transform.times(Mat4.translation(0, 3, 0));
        this.shapes.Windmill.draw(context, program_state, model_transform, this.materials.plastic);
    }

    drawfloor(context, program_state) {
        let model_transform = Mat4.scale(this.floor.coor_x, 1, this.floor.coor_z);
        this.shapes.Cube.draw(context, program_state, model_transform, this.materials.floor);
    }

    drawBlocks(context, program_state) {
        this.blocks.forEach(block => {
            block.draw(context, program_state, block.model_transform, block.material);
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
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
        void main(){
            gl_FragColor = vec4( 0.15, 0.3, 0.08, 1);
        }`;
    }
}

class Bright_Shader extends Shader {
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
            gl_FragColor = vec4( 0.8, 0.76, 0.45, 1);
        }`;
    }
}

class Very_Bright_Shader extends Shader {
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
            gl_FragColor = vec4( 0.95, 0.9, 0.65, 1);
        }`;
    }
}



