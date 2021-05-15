import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec, vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

function getMouseposition(canvas, x, y) {
    let rect = canvas.getBoundingClientRect();
    let hori_center = rect.width / 2;
    let verti_center = rect.height / 2;
    return vec((x - hori_center) / hori_center, (y - verti_center) / verti_center);
}

class MousePicking extends Scene {

    constructor() {
        super();
        this.will_take_over_graphics_state = true;
        this.MouseMonitoradded = false
    }

    set_recipient(matrix_closure, inverse_closure, projection_matrix) {
        // set_recipient(): The camera matrix is not actually stored here inside Movement_Controls;
        // instead, track an external target matrix to modify.  Targets must be pointer references
        // made using closures.
        this.matrix = matrix_closure;
        this.inverse = inverse_closure;
        this.projection_m = projection_matrix;
    }

    reset(graphics_state) {
        // reset(): Initially, the default target is the camera matrix that Shaders use, stored in the
        // encountered program_state object.  Targets must be pointer references made using closures.
        this.set_recipient(() => graphics_state.camera_transform,
            () => graphics_state.camera_inverse,
            () => graphics_state.projection_transform);
    }



    add_mouse_controls(canvas) {
        // add_mouse_controls():  Attach HTML mouse events to the drawing canvas.
        // First, measure mouse steering, for rotating the flyaround camera:
        this.mouse = { "from_center": vec(0, 0) };
        // const mouse_position = (e, rect = canvas.getBoundingClientRect()) => {
        //     let hori_center = rect.width / 2;
        //     let verti_center = rect.height / 2;
        //     return vec((e.clientX - hori_center) / hori_center, (e.clientY - verti_center) / verti_center);
        // }
        //Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
        // document.addEventListener("mouseup", e => {
        //     this.mouse.anchor = undefined;
        // });
        // canvas.addEventListener("mousedown", e => {
        //     e.preventDefault();
        //     this.mouse.anchor = mouse_position(e);
        // });
        // canvas.addEventListener("mousemove", e => {
        //     e.preventDefault();
        //     this.mouse.from_center = mouse_position(e);
        // });
        // canvas.addEventListener("mouseout", e => {
        //     if (!this.mouse.anchor) this.mouse.from_center.scale_by(0)
        // });

        canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            this.mousePos = getMouseposition(canvas, e.offsetX, e.offsetY);
            this.ray_clip = vec4(this.mousePos[0], this.mousePos[1], -1.0, 1.0);

            this.ray_eye = Mat4.inverse(this.projection_m()).times(this.ray_clip);
            this.ray = this.inverse().times(this.ray_eye).normalized();

            console.log(this.ray);
        })
    }


    show_explanation(document_element) {
    }

    make_control_panel() {
        // make_control_panel(): Sets up a panel of interactive HTML elements, including
        // buttons with key bindings for affecting this scene, and live info readouts.
        this.control_panel.innerHTML += "The Mouse Picking Module";
        this.new_line();
    }




    display(context, graphics_state, dt = graphics_state.animation_delta_time / 1000) {

        if (this.will_take_over_graphics_state) {
            this.reset(graphics_state);
            this.will_take_over_graphics_state = false;
        }

        if (!this.MouseMonitoradded) {
            this.add_mouse_controls(context.canvas);
            this.MouseMonitoradded = true;
            console.log(context.canvas);
            console.log(context.canvas.getBoundingClientRect());
        }

        // Log some values:
        this.pos = this.inverse().times(vec4(0, 0, 0, 1));
        //console.log(this.pos);
        this.z_axis = this.inverse().times(vec4(0, 0, 1, 0));
        //console.log(context.canvas.getBoundingClientRect())
    }
}

export { MousePicking }
