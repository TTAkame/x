#version 300 es

precision mediump float;

// Uniforms
uniform int filter_mode;
uniform float depth_scaling;
uniform float near;
uniform float far;

// Texture samplers
uniform sampler2D color_texture;
uniform sampler2D depth_texture;

// Input from vertex shader
in vec2 o_texture_coord;

// Output color
out vec4 o_fragColor;

float linearize_depth(float depth) {
    float z = depth * 2.0 - 1.0; // Back to NDC
    return depth_scaling * (2.0 * near * far) / (far + near - z * (far - near));    
}

float sobel(sampler2D tex, vec2 uv) {
    mat3 sx = mat3( 
        1.0,  2.0,  1.0, 
        0.0,  0.0,  0.0, 
       -1.0, -2.0, -1.0 
    );

    mat3 sy = mat3( 
        1.0, 0.0, -1.0, 
        2.0, 0.0, -2.0, 
        1.0, 0.0, -1.0
    );

    float x = 0.0;
    float y = 0.0;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            vec2 sample_uv = uv + vec2(i - 1, j - 1) / 512.0;
            x += sx[i][j] * texture(tex, sample_uv).r;
            y += sy[i][j] * texture(tex, sample_uv).r;
        }
    }

    return sqrt(x * x + y * y);
}

void main() {
    if (filter_mode == 0) // Identity Filter
    {
        vec4 inputColor = texture(color_texture, o_texture_coord);
        o_fragColor = mix(inputColor, vec4(1.0, 1.0, 1.0, 1.0), 0.5);
    }
    else if (filter_mode == 1) // Depth Filter
    {
        float depth = texture(depth_texture, o_texture_coord).r;
        o_fragColor = vec4(vec3(linearize_depth(depth)), 1);
    }
    else if (filter_mode == 2) // Sobel Filter
    {
        vec4 edgeColor = vec4(1.0, 0.76171875, 0.0, 1);
        vec4 inputColor = texture(color_texture, o_texture_coord);
        float g = sobel(color_texture, o_texture_coord);
        o_fragColor = mix(inputColor, edgeColor, g);

        // Correct fragment depth values if needed
        // ...
    }
    else
    {
        o_fragColor = vec4(0, 1, 0, 1); // Debug color
    }
}

