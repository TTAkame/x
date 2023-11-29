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
        this.renderpass_normal(gl, canvas_width, canvas_height);
        fbo.unbindFramebuffer(gl);

        // Second rendering pass: Render the texture to the default framebuffer
        this.setViewport(gl, canvas_width, canvas_height);
        this.clearCanvas(gl);

        let quad_shader = this.shaders[3]; // Replace with your shader for rendering the quad
        quad_shader.use();
        // Bind the texture from the first pass
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.getColorTexture());
        quad_shader.setUniform1i('color_texture', 0); // Replace 'uTexture' with your texture uniform

        // Render the full-screen quad
        this.quad.render(gl);

        quad_shader.unuse();
    }

    do_depth_pass(gl, fbo, current_light) {
        // Compute the scale of the current scene
        let scale = mat4.getScaling(vec3.create(), this.scene.scenegraph.transformation);

        // Bind the depth framebuffer
        fbo.bindFramebuffer(gl);

        // Set viewport to the depth framebuffer size
        gl.viewport(0, 0, fbo.width, fbo.height);

        // Clear the framebuffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let shadow_camera = current_light.getCamera(scale);
        let shadow_v = shadow_camera.getViewMatrix();
        let shadow_p = shadow_camera.getProjectionMatrix();

        let shader = this.shaders[2]; // Replace with your depth shader
        shader.use();
        // Set uniforms for the depth shader (e.g., light matrices)
        shader.setUniform4x4f('uView', shadow_v);
        shader.setUniform4x4f('uProjection', shadow_p);
        // ...

        this.renderpass_normal(gl, fbo.width, fbo.height, ['light']);

        shader.unuse();

        fbo.unbindFramebuffer(gl);

        // Combine view and projection matrix for later use
        let shadow_pv = mat4.multiply(mat4.create(), shadow_p, shadow_v);
        return shadow_pv;
    }

    renderpass_shadowmap(gl, canvas_width, canvas_height) {
        let u_shadow_pv_directional = mat4.identity(mat4.create());
        let u_shadow_pv_point = mat4.identity(mat4.create());

        if (this.first_directional_light) {
            u_shadow_pv_directional = this.do_depth_pass(gl, this.fbo_directional, this.first_directional_light);
        }
        if (this.first_point_light) {
            u_shadow_pv_point = this.do_depth_pass(gl, this.fbo_point, this.first_point_light);
        }

        // Normal rendering pass with shadow mapping
        this.setViewport(gl, canvas_width, canvas_height);
        this.clearCanvas(gl);

        let shadow_shader = this.shaders[2]; // Replace with your shadow mapping shader
        shadow_shader.use();

        // Set camera and light uniforms
        // ...

        // Bind and set depth textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fbo_directional.getDepthTexture());
        shadow_shader.setUniform1i('uDirectionalDepthMap', 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.fbo_point.getDepthTexture());
        shadow_shader.setUniform1i('uPointDepthMap', 1);

        // ...

        shadow_shader.unuse();

        // Render the scene
        this.scene.render(gl, ['light']);

        // Finally, render lights annotations if needed
        if (this.first_directional_light) this.first_directional_light.render(gl);
        if (this.first_point_light) this.first_point_light.render(gl);
    }
}

export default RenderPasses;
