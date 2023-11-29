#version 300 es

in vec3 a_position;
in vec3 a_normal;

// transformation matrices
uniform mat4 u_m;
uniform mat4 u_v;
uniform mat4 u_p;
uniform mat4 u_shadow_pv_directional;
uniform mat4 u_shadow_pv_point;

// output to fragment stage
out vec3 o_vertex_normal_world;
out vec3 o_vertex_position_world;
out vec4 o_shadow_coord_directional;
out vec4 o_shadow_coord_point;

void main() {
    // transform vertex position to world space
    vec4 vertex_position_world = u_m * vec4(a_position, 1.0);
    o_vertex_position_world = vertex_position_world.xyz;

    // calculate normal in world space
    mat3 norm_matrix = transpose(inverse(mat3(u_m)));
    vec3 vertex_normal_world = normalize(norm_matrix * a_normal);
    o_vertex_normal_world = vertex_normal_world.xyz;

    // compute shadow coordinates
    o_shadow_coord_directional = u_shadow_pv_directional * vertex_position_world;
    o_shadow_coord_point = u_shadow_pv_point * vertex_position_world;

    // transform vertex position to clip space
    gl_Position = u_p * u_v * vertex_position_world;
}
