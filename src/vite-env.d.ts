/// <reference types="vite/client" />

// Allow importing .glsl files as raw strings via Vite's ?raw suffix
// Usage: import vertexShader from './shaders/vertex.glsl?raw'
declare module '*.glsl?raw' {
  const value: string;
  export default value;
}
