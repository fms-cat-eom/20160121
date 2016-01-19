( function() {

	'use strict';

	// ------

	var randomWidth = 1024;
	var randomHeight = 1024;
	var noiseWidth = 512;
	var noiseHeight = 512;

	// ------

  var canvas = document.getElementById( 'canvas' );
	var gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );
	var glCat = new GLCat( gl );

	// ------

	var vbo = {};
	var framebuffer = {};
	var texture = {};
	var shader = {};
  var program = {};

	// ------

	var frame = 0;

  // ------

	var prepare = function() {

	  vbo.quad = glCat.createVertexbuffer( [ -1, -1, 3, -1, -1, 3 ] );

	  // ------

		framebuffer.noise = glCat.createFloatFramebuffer( noiseWidth, noiseHeight );
		framebuffer.render = [];
		framebuffer.render[ 0 ] = glCat.createFloatFramebuffer( canvas.width, canvas.height );
		framebuffer.render[ 1 ] = glCat.createFloatFramebuffer( canvas.width, canvas.height );
		framebuffer.render[ 2 ] = glCat.createFloatFramebuffer( canvas.width, canvas.height );
		framebuffer.map = glCat.createFloatFramebuffer( canvas.width, canvas.height );

	  // ------

	  texture.random = glCat.createTexture();
		glCat.setTextureFromFloatArray( texture.random, randomWidth, randomHeight, ( function() {
			var a = [];
			for ( var i = 0; i < randomWidth * randomHeight * 4; i ++ ) {
				a.push( Math.random() );
			}
			return a;
		} )() );

	};

  // ------

  var update = function() {

		var time = ( frame / 100.0 ) % 1.0;

		{ // noise field
			glCat.useProgram( program.noise );
			gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.noise );
			gl.viewport( 0, 0, noiseWidth, noiseHeight );

			glCat.clear();
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

			glCat.attribute( 'position', vbo.quad, 2 );

			glCat.uniform1f( 'time', time );
			glCat.uniform2fv( 'resolution', [ noiseWidth, noiseHeight ] );

			gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
		}

		for ( var i = 0; i < 3; i ++ ) { // rendering
      glCat.useProgram( program.render[ i ] );
      gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.render[ i ] );
      gl.viewport( 0, 0, canvas.width, canvas.height );

			glCat.clear();
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

      glCat.attribute( 'position', vbo.quad, 2 );

			glCat.uniform1f( 'time', time );
      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

      glCat.uniformTexture( 'noiseTexture', framebuffer.noise.texture, 0 );

      gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
    }

		{ // map
      glCat.useProgram( program.map );
      gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.map );
      gl.viewport( 0, 0, canvas.width, canvas.height );

			glCat.clear();
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

      glCat.attribute( 'position', vbo.quad, 2 );

			glCat.uniform1f( 'time', time );
      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

			glCat.uniformTexture( 'noiseTexture', framebuffer.noise.texture, 0 );

      gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
    }

		{ // merge
      glCat.useProgram( program.merge );
      gl.bindFramebuffer( gl.FRAMEBUFFER, null );
      gl.viewport( 0, 0, canvas.width, canvas.height );

			glCat.clear();
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

      glCat.attribute( 'position', vbo.quad, 2 );

			glCat.uniform1f( 'time', time );
      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

			for ( var i = 0; i < 3; i ++ ) {
				glCat.uniformTexture( 'render' + i, framebuffer.render[ i ].texture, i );
			}
			glCat.uniformTexture( 'map', framebuffer.map.texture, 3 );

      gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
    }

		frame ++;

    if ( 200 <= frame ) {
      // var url = canvas.toDataURL();
      // var a = document.createElement( 'a' );
      // a.download = ( '000' + frame ).slice( -4 ) + '.png';
      // a.href = url;
      // a.click();
    }

    requestAnimationFrame( update );

  };

  // ------

  var ready = false;

	document.getElementById( 'button' ).addEventListener( 'click', function() {
    if ( ready && frame === 0 ) {
			prepare();
      update();
    }
  } );

  step( {

    0: function( _step ) {

			[
				'plane.vert',
				'noise.frag',
				'render.frag',
				'map.frag',
				'merge.frag'
			].map( function( _name ) {
				requestText( './shader/' + _name, function( _text ) {
					shader[ _name ] = _text;
					_step();
				} );
			} );

		},

    5: function( _step ) {

			program.noise = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'noise.frag' ] );
			program.render = [];
			program.render[ 0 ] = glCat.createProgram( shader[ 'plane.vert' ], '#define GLA 0.60\n#define GLB 0.60\n' + shader[ 'render.frag' ] );
			program.render[ 1 ] = glCat.createProgram( shader[ 'plane.vert' ], '#define GLA 0.80\n#define GLB 0.80\n' + shader[ 'render.frag' ] );
			program.render[ 2 ] = glCat.createProgram( shader[ 'plane.vert' ], '#define GLA 0.01\n#define GLB 0.01\n' + shader[ 'render.frag' ] );
			program.map = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'map.frag' ] );
			program.merge = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'merge.frag' ] );

      ready = true;

    }

  } );

} )();
