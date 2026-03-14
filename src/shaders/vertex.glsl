// Simple pass-through vertex shader
// Transforms vertex positions from model space to clip space

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
