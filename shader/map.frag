precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D noiseTexture;

#define PI 3.14159265
#define V vec2(0.,1.)
#define saturate(i) clamp(i,0.,1.)

vec3 glitch;

void main() {
  glitch *= texture2D( noiseTexture, glitch.x * V.yy ).xyz;
  glitch += texture2D( noiseTexture, glitch.y * V.xy ).xyz;
  glitch -= texture2D( noiseTexture, glitch.z * V.yx ).xyz;
  gl_FragColor.xyz = glitch * 3.0 + time;
  gl_FragColor.xyz = mod( gl_FragColor.xyz, 1.0 );
}
