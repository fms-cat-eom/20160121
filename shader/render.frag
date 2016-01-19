precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D noiseTexture;

#define PI 3.14159265
#define V vec2(0.,1.)
#define saturate(i) clamp(i,0.,1.)

#define MARCH_ITER 96
#define MARCH_MULTIPLIER 0.8

vec2 p;

vec3 camPos;
vec3 camDir;
vec3 camSid;
vec3 camTop;

vec3 rayDir;
vec3 rayBeg;
float rayLen;
vec3 rayPos;
vec4 rayCol;
float rayDist;
float rayDistMin;

vec3 mtlDif;
vec3 mtlSpe;
vec3 mtlAura;
vec3 posGlitch;

void setCamera() {
  camPos = V.xxy * 2.5;
  camDir = V.xxy * -1.0;
  vec3 camAir = V.xyx;
  camSid = normalize( cross( camDir, camAir ) );
  camTop = normalize( cross( camSid, camDir ) );
}

void initRay() {
  rayDir = normalize( camSid * p.x + camTop * p.y + camDir );
  rayBeg = camPos;
  rayLen = 0.01;
  rayPos = rayBeg + rayDir * rayLen;
  rayCol = V.xxxy;
}

// ------

float smin( float a, float b, float k, inout float h ) {
  h = clamp( 0.5 + 0.5 * ( b - a ) / k, 0.0, 1.0 );
  return mix( b, a, h ) - k * h * ( 1.0 - h );
}

float smin( float a, float b, float k ) {
  float dummy = 0.0;
  return smin( a, b, k, dummy );
}

vec3 lissajous( vec3 _m ) {
  return vec3(
    sin( _m.x ),
    sin( _m.y ),
    sin( _m.z )
  );
}

// ------

float distFunc( vec3 _p ) {
  vec3 glA = posGlitch * GLA;
  vec3 glB = posGlitch * GLB;

  vec3 pos = lissajous( vec3( -2.0, -1.0, 2.0 ) * PI * time + glA ) * 0.4 - glB;
  float dist = length( _p + pos ) - 0.41;

  pos = lissajous( vec3( 4.0, 3.0, 2.0 ) * PI * time + glA ) * 0.5 + glB;
  float distC = length( _p + pos ) - 0.41;
  dist = smin( dist, distC, 1.0 );

  pos = lissajous( vec3( 3.0, -1.0, -3.0 ) * PI * time + glA ) * 0.6 - glB;
  distC = length( _p + pos ) - 0.41;
  dist = smin( dist, distC, 1.0 );

  pos = lissajous( vec3( -1.0, 2.0, -4.0 ) * PI * time + glA ) * 0.7 + glB;
  distC = length( _p + pos ) - 0.41;
  dist = smin( dist, distC, 1.0 );

  pos = lissajous( vec3( 2.0, 4.0, -1.0 ) * PI * time + glA ) * 0.8 - glB;
  distC = length( _p + pos ) - 0.41;
  dist = smin( dist, distC, 1.0 );

  return dist;
}

vec3 normalFunc( vec3 _p, float _d ) {
  vec2 d = V + _d;
  return normalize( vec3(
    distFunc( _p + d.yxx ) - distFunc( _p - d.yxx ),
    distFunc( _p + d.xyx ) - distFunc( _p - d.xyx ),
    distFunc( _p + d.xxy ) - distFunc( _p - d.xxy )
  ) );
}

void march() {
  posGlitch *= pow( texture2D( noiseTexture, vec2( time * -0.05 + 0.8, 0.0 ) ).x, 1.1 ) * 1.8;

  for ( int iMarch = 0; iMarch < MARCH_ITER; iMarch ++ ) {
    rayDist = distFunc( rayPos );
    if ( iMarch == 0 ) { rayDistMin = rayDist; }
    else { rayDistMin = min( rayDist, rayDistMin ); }
    rayLen += rayDist * MARCH_MULTIPLIER;
    rayPos = rayBeg + rayDir * rayLen;
    if ( abs( rayDist ) < 1E-3 || 1E2 < rayLen ) { break; }
  }
}

void shade() {
  if ( time < 0.8 && false ) {
    mtlDif = vec3( 0.4, 0.7, 0.9 );
    mtlSpe = V.yyy * 0.4;
    mtlAura = vec3( 0.0, 0.4, 0.9 );
  } else {
    mtlDif = mtlDif * 0.3 + 0.7;
  }

  if ( rayDist < 1E-2 ) {
    vec3 nor = normalFunc( rayPos, 1E-2 );
    vec3 ligPos = vec3( -2.0, 4.0, 5.0 );
    vec3 ligDir = normalize( rayPos - ligPos );
    vec3 dif = saturate( dot( ligDir, -nor ) * 0.5 + 0.5 ) * mtlDif;
    vec3 spe = saturate( pow( dot( normalize( ligDir + rayDir ), -nor ), 20.0 ) ) * mtlSpe;
    rayCol.xyz = dif + spe;
  } else {
    rayCol.xyz += exp( -rayDistMin * 3.0 ) * mtlAura;
  }
}

vec3 catColor( float _theta ) {
  return vec3(
    sin( _theta ),
    sin( _theta + 2.0 ),
    sin( _theta + 4.0 )
  ) * 0.5 + 0.5;
}

void main() {
  p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.x;
  setCamera();
  initRay();
  march();
  shade();
  gl_FragColor = vec4( rayCol.xyz, 1.0 );
}
