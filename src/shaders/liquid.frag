// Liquid hero background — an oil-on-water / molten-glass surface built entirely
// from domain-warped simplex noise. No textures, no particles, no geometry: every
// pixel's color comes from evaluating noise fields at that point.
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

// ---------------------------------------------------------------------------
// 1. Simplex noise (Ashima Arts / Ian McEwan, MIT license)
// Standard 3D simplex noise — the third input is used as the time axis so the
// whole field evolves continuously instead of scrolling a 2D texture.
// ---------------------------------------------------------------------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// ---------------------------------------------------------------------------
// 2. Fractal Brownian Motion — stacks octaves of simplex noise so the field
// has both slow, large swells and finer surface detail (the "turbulence").
// ---------------------------------------------------------------------------
float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return sum;
}

// ---------------------------------------------------------------------------
// 3. Domain warping (Inigo Quilez technique) — instead of sampling noise
// directly, feed the coordinate through two nested layers of fbm first. This
// is what gives the field its "liquid flowing over itself" look rather than
// a static noise texture: q and r are themselves slowly evolving flow fields.
// ---------------------------------------------------------------------------
float liquidField(vec2 p, float t, out vec2 flow) {
  vec2 q = vec2(
    fbm(vec3(p, t)),
    fbm(vec3(p + vec2(5.2, 1.3), t))
  );

  vec2 r = vec2(
    fbm(vec3(p + 4.0 * q + vec2(1.7, 9.2), t + 0.15)),
    fbm(vec3(p + 4.0 * q + vec2(8.3, 2.8), t + 0.15))
  );

  flow = r - q; // direction the "liquid" is locally flowing, reused for chromatic offset
  return fbm(vec3(p + 4.0 * r, t));
}

// ---------------------------------------------------------------------------
// 4. Color palette — blends the three brand colors by noise value instead of
// screen position, so the transitions are irregular blobs/veins, never a
// straight or radial gradient.
// ---------------------------------------------------------------------------
vec3 palette(float v) {
  vec3 green  = vec3(0.627, 0.878, 0.671); // rgb(160,224,171)
  vec3 amber  = vec3(1.000, 0.675, 0.180); // rgb(255,172,46)
  vec3 maroon = vec3(0.647, 0.176, 0.145); // rgb(165,45,37)

  float t = v * 0.5 + 0.5; // snoise/fbm output is roughly [-1, 1] -> [0, 1]
  vec3 col = mix(green, amber, smoothstep(0.25, 0.6, t));
  col = mix(col, maroon, smoothstep(0.55, 0.9, t));
  return col;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uResolution.x / max(uResolution.y, 1.0);

  // slow drift toward the pointer keeps the surface alive without ever
  // snapping — uMouse itself is already smoothed (lerped) on the JS side
  vec2 mouseOffset = (uMouse - 0.5) * 0.3;

  // extremely slow evolution: a full cycle takes minutes, never seconds
  float t = uTime * 0.05;
  vec2 p = uv * 1.1 + mouseOffset;

  vec2 flow;
  float field = liquidField(p, t, flow);

  // 5. Chromatic distortion — resample the field per channel along the local
  // flow direction so color edges separate slightly, like light refracting
  // through a thin liquid film rather than a flat, uniform blend.
  vec2 chroma = flow * 0.015;
  float fieldR = liquidField(p + chroma, t, flow);
  float fieldB = liquidField(p - chroma, t, flow);

  vec3 color = vec3(
    palette(fieldR).r,
    palette(field).g,
    palette(fieldB).b
  );

  // soft, noise-driven bloom: brighten only where the field peaks, instead of
  // a uniform screen-space glow, so it reads as illuminated liquid, not a filter
  float glow = smoothstep(0.55, 1.0, field) * 0.35;
  color += glow;

  // gentle vignette to keep edges cinematic and pull focus toward the center
  float vignette = 1.0 - smoothstep(0.6, 1.4, length(uv));
  color *= mix(0.85, 1.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
