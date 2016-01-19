precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D noiseTexture;

#define PI 3.14159265
#define V vec2(0.,1.)
#define saturate(i) clamp(i,0.,1.)

float glitch;

void main() {
  if ( gl_FragCoord.x < 4.0 ) { gl_FragColor.xyz = V.yyy; }
  else { gl_FragColor.x = glitch; }
}
