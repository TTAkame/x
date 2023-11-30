'use strict';

import { mat4, vec3 } from './js/lib/glmatrix/index.js'; // Make sure to adjust the path as needed
import Quad from './assignment4.quad.js'; // Adjust the path
import FrameBufferObject from './assignment4.fbo.js'; // Adjust the path
import WebGlApp from './js/app/webglapp.js';

class RenderPasses extends WebGlApp {
    constructor(gl, shaders) {
        super(gl, shaders);

        // Create a screen quad instance
        this.quad = new Quad(gl, this.quad_shader);

        // Create framebuffer objects
        this.fbo_pixel_filter = new FrameBufferObject(gl);
        this.fbo_directional = new FrameBufferObject(gl);
        this.fbo_point = new FrameBufferObject(gl);

        this.fbo_directional.resize(gl, 1024, 1024);
        this.fbo_point.resize(gl, 1024, 1024);

        this.fbo_preview = true;
        this.fbo = this.fbo_pixel_filter;
    }

    renderpass_normal(gl, canvas_width, canvas_height, excludes = null) {
        this.scene.setShader(gl, this.shaders[this.active_shader]);

        // Set viewport and clear canvas
        this.setViewport(gl, canvas_width, canvas_height);
        this.clearCanvas(gl);
        this.scene.render(gl, excludes);
    }

    renderpass_pixel_filter(gl, canvas_width, canvas_height) {
        let fbo = this.fbo_pixel_filter;
        fbo.resize(gl, canvas_width, canvas_height);

        // First rendering pass: Render scene to FBO
        fbo.bindFramebuffer(gl);
        this.renderpass_normal(gl, canvas_width, canvas_height,['light']);
        fbo.unbindFramebuffer(gl);

        // Second rendering pass: Render the texture to the default framebuffer
        this.setViewport(gl, canvas_width, canvas_height);
        this.clearCanvas(gl);

        let quad_shader = this.quad; 
        // Bind the texture from the first pass
        quad_shader.render(gl,this.filter_mode,fbo.getColorTexture(),fbo.getDepthTexture());
        this.scene.render( gl, [ 'model' ] )

    }

    do_depth_pass( gl, fbo, current_light )
    {
        // compute the scale of the corrent scene
        let scale = mat4.getScaling(vec3.create(), this.scene.scenegraph.transformation)

        // TODO compute camera matrices from 
        let shadow_v
        let shadow_p

        // TODO first rendering pass
        {
            // TODO add missing steps ...

            let shadow_camera = current_light.getCamera( scale )
            shadow_v = shadow_camera.getViewMatrix()
            shadow_p = shadow_camera.getProjectionMatrix()

            let shader = this.shaders[this.active_shader]

            {
                // TODO configure shader parameters
            }

            this.renderpass_normal(gl, fbo.width, fbo.height, [ 'light' ])

            {
                // TODO restore shader parameters
            }
        
            // TODO add missing steps ...
        }

        return // TODO compute the output projection matrix
    }

    renderpass_shadowmap( gl, canvas_width, canvas_height )
    {
        // compute the light-camera matrices for both lights
        let u_shadow_pv_directional = mat4.identity(mat4.create())
        let u_shadow_pv_point = mat4.identity(mat4.create())
        if (this.first_directional_light) {
            u_shadow_pv_directional = 
                this.do_depth_pass( gl, this.fbo_directional, this.first_directional_light )
        }
        if (this.first_point_light) {
            u_shadow_pv_point = 
                this.do_depth_pass( gl, this.fbo_point, this.first_point_light )
        }

        // TODO final rendering pass
        {
            // TODO add missing steps ...  

            this.scene.setShader(gl, this.shadow_shader)
            {
                let shader = this.shadow_shader
                shader.use()

                // TODO First, restore camera position

                // TODO Second, pass-in light-camera matrices

                // TODO Activate the depth texture for the directional light

                // TODO Activate the depth texture for the point light

                shader.unuse()
            }

            // TODO render the scene normally without lights
            this.scene.render( gl, [ 'light' ] )

            // Finally render the annotation of lights
            if (this.first_directional_light) this.first_directional_light.render( gl )
            if (this.first_point_light) this.first_point_light.render( gl )
        }
    }
}

export default RenderPasses