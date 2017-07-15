[vertex]
precision mediump float;
attribute vec3 position;
uniform mat4 projection;
uniform mat4 view;
uniform mat4 transform;
void main () {
	gl_Position = projection * view * transform * vec4(position, 1);
}

[fragment]
precision mediump float;
uniform vec4 color;
void main () {
	gl_FragColor = color / 255.0;
}
