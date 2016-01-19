precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D render0;
uniform sampler2D render1;
uniform sampler2D render2;
uniform sampler2D map;

#define PI 3.14159265
#define V vec2(0.,1.)
#define saturate(i) clamp(i,0.,1.)

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 m = texture2D( map, uv / vec2( 16.0, 4.0 ) ).xyz;
  float p = mix(
    time,
    m.z,
    0.2
  );
  p = mod( p, 1.0 );
  vec2 d = pow( vec2( m.x, 0.0 ), 20.0 * V.yy ) * 0.4;
  if ( p < 0.33 ) {
    gl_FragColor = texture2D( render0, uv + d );
  } else if ( p < 0.67 ) {
    gl_FragColor = texture2D( render1, uv + d );
  } else {
    gl_FragColor = texture2D( render2, uv + d );
  }

  gl_FragColor.xyz = mix(
    gl_FragColor.xyz,
    vec3( 1.0, 0.0, 0.3 ),
    pow( m.y, 100.0 )
  );
}
