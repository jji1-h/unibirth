// ── 별 표면 셰이더 (대류셀 + limb darkening) ────────────
export const STAR_VERT = `
  varying vec3 vLocalNormal;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vLocalNormal = normalize(normal);
    vNormal      = normalize(normalMatrix * normal);
    vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
    vViewDir     = normalize(-mvPos.xyz);
    gl_Position  = projectionMatrix * mvPos;
  }
`

export const STAR_FRAG = `
  uniform float uTime;
  uniform vec3  uColor;
  varying vec3 vLocalNormal;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p) {
    float v=0.0; float a=0.5;
    for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=0.5;}
    return v;
  }

  void main() {
    float cosA = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float ld   = pow(cosA, 0.35);
    vec3  n  = vLocalNormal;
    float t  = uTime * 0.12;
    vec2  p1 = vec2(n.x + n.z, n.y) * 4.0;
    vec2  p2 = vec2(n.y - n.x, n.z) * 4.0;
    vec2  p3 = vec2(n.z + n.y, n.x) * 3.5;
    float g1 = fbm(p1 + vec2(t, t * 0.6));
    float g2 = fbm(p2 * 2.3 - vec2(t * 0.4, t * 0.8));
    float grain = g1 * 0.6 + g2 * 0.4;
    float hot = smoothstep(0.58, 0.76, fbm(p3 + vec2(t * 0.25, -t * 0.18)));
    vec3 white = vec3(1.0, 0.97, 0.92);
    vec3 col   = mix(uColor * 0.7, uColor * 1.05, grain);
    col = mix(col, white, hot * 0.55);
    col = mix(col * 0.5, col * 1.15, ld);
    gl_FragColor = vec4(clamp(col, 0.0, 1.6), 1.0);
  }
`

// ── 채층(Chromosphere) 셰이더 ────────────────────────────
export const CHROMO_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(-(modelViewMatrix * vec4(position,1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`
export const CHROMO_FRAG = `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    rim = pow(rim, 2.8);
    gl_FragColor = vec4(uColor * 1.8 + 0.2, rim * uOpacity);
  }
`
