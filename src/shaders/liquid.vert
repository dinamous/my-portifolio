// Fullscreen plane — no vertex displacement, all motion happens in the fragment
// shader's noise field. Just hand the UV down and project the vertex normally.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
