// Simple color fragment shader
// Outputs a single solid color for each fragment

uniform vec3 uColor;

void main() {
  gl_FragColor = vec4(uColor, 1.0);
}
