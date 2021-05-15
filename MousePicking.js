import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec, vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

function getMouseposition(canvas, x, y) {
    let rect = canvas.getBoundingClientRect();
    let hori_center = rect.width / 2;
    let verti_center = rect.height / 2;
    return vec((x - hori_center) / hori_center, -(y - verti_center) / verti_center);
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

    //convert mouse postion to a ray in world space
    getRay(mousePos) {
        let ray_clip = vec4(mousePos[0], mousePos[1], -1.0, 1.0);
        let ray_eye = Mat4.inverse(this.projection_m()).times(ray_clip);
        ray_eye[2] = -1.0;
        ray_eye[3] = 0.0;
        let ray_world = this.matrix().times(ray_eye);
        return ray_world.to3().normalized();
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

        // canvas.addEventListener("click", e => {
        //     e.preventDefault();
        //     //console.log(this.mousePos);
        //     //this.ray = this.getRay(getMouseposition(canvas, e.offsetX, e.offsetY));
        //     //set camera matrix
        //     let newCam_m = Mat4.look_at(this.matrix().times(vec4(0, 0, 0, 1)).to3(), this.matrix().times(vec4(0, 0, 0, 1)).to3().plus(this.ray), vec3(0, 1, 0));
        //     this.setNewCamera = () => newCam_m; //the new camera matrix
        //     //console.log(this.matrix());
        //     //console.log((this.inverse().times(this.projection_m())));
        //     //console.log(this.projection_m().times(this.inverse().times(vec4(0, 0, 0, 1))));

        // })

        canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            this.mousePos = getMouseposition(canvas, e.offsetX, e.offsetY);
            this.ray = this.getRay(this.mousePos);
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

        if (this.setNewCamera !== undefined) {
            graphics_state.set_camera(this.setNewCamera());
            this.setNewCamera = undefined;
        }

        // Log some values:
        this.pos = this.inverse().times(vec4(0, 0, 0, 1));
        //console.log(this.pos);
        this.z_axis = this.inverse().times(vec4(0, 0, 1, 0));
        //console.log(context.canvas.getBoundingClientRect())
    }
}

export { MousePicking }
