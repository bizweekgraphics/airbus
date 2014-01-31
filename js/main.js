// from http://stackoverflow.com/a/326076/120290
function inIframe() {
    try {
        return window.self !== window.top;
    } catch(err) {
        return true;
    }
}

$( document ).ready(function() {  
  if(inIframe()) $("body").addClass("iframed");
});

//////////////////////////////////////////////////////////////////////////////////////////
// THREE.JS //////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var stats, scene, renderer;
var camera, controls, lastCameraPosition;
var plane, text3d; //will be loaded from .dae (collada) files

var camera, scene, projector, raycaster, renderer;

var mouseDown = false;
var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 7, theta = 0;

var annotationLines = new Object();
var highlighted = "";
var annotations = {
	"nose": {
		"annotation": "The cockpit's the room where pilots and navigator sit, but that's not important right now. Interior pic goes here.",
		"coords": [0, .5, 2.5]
		},
	"side": {
		"annotation": "The fuselage seats four people, or six children. It looks like a big Tylenol.",
		"coords": [0, .5, 0]
		},
	"tail": {
		"annotation": "The tail is larger than the tails of most monkeys.",
		"coords": [0, 1, -2]
		},
	"top": {
		"annotation": "With a wingspan of 213 feet, the Airbus is, like, pretty wide. TK TK TK blah blah hello.",
		"coords": [1,, 0 -1]
		},    	
	"engine": {
		"annotation": "The twin Rolls-Royce Trent XWB turbofans produce like a million pounds of thrust each. Roughly.",
		"coords": [1, 0, 1]
		}
	};

if( !init() )	animate();

// init the scene
function init(){

	if( Detector.webgl ){
		renderer = new THREE.WebGLRenderer({
			antialias		: true,	// to get smoother output
			preserveDrawingBuffer	: true,	// to allow screenshot
			alpha: true,
			clearColor: 0xff0000,
			clearAlpha: 1
		});
	// uncomment if webgl is required
	//}else{
	//	Detector.addGetWebGLMessage();
	//	return true;
	}else{
		renderer	= new THREE.CanvasRenderer();
	}
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById('container').appendChild(renderer.domElement);

	// add Stats.js - https://github.com/mrdoob/stats.js
	stats = new Stats();
	stats.domElement.style.position	= 'absolute';
	stats.domElement.style.bottom	= '0px';
	document.body.appendChild( stats.domElement );

	// create a scene
	scene = new THREE.Scene();

	// CAMERA
	
	// place camera in scene
	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(-4,2,8);
	//camera.up = new THREE.Vector3(0,0,1);
	camera.lookAt(scene.position);
	scene.add(camera);

	// create a camera contol
	// cf. view-source:http://threejs.org/examples/misc_controls_orbit.html
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );

	// transparently support window resize
	THREEx.WindowResize.bind(renderer, camera);

	// for reference, cube at center
	/*
	geometry = new THREE.CubeGeometry( 1, 1, 1 );
	material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	mesh = new THREE.Mesh( geometry, material );
	//mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
	scene.add( mesh );
	*/
	
	//annotations line
	/*
    annotationLines.fuselage = buildLine("fuselage");
    annotationLines.cockpit = buildLine("cockpit");
    annotationLines.tail = buildLine("tail");
    scene.add(annotationLines.fuselage);
    scene.add(annotationLines.cockpit);
    scene.add(annotationLines.tail);
	*/
	
	/// SKYBOX ///
	
	var mesh
	texture_placeholder = document.createElement( 'canvas' );
	texture_placeholder.width = 128;
	texture_placeholder.height = 128;

	var context = texture_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );

	var materials = [

		loadTexture( 'img/skybox/px.jpg' ), // right
		loadTexture( 'img/skybox/nx.jpg' ), // left
		loadTexture( 'img/skybox/py.jpg' ), // top
		loadTexture( 'img/skybox/ny.jpg' ), // bottom
		loadTexture( 'img/skybox/pz.jpg' ), // back
		loadTexture( 'img/skybox/nz.jpg' )  // front

	];

	mesh = new THREE.Mesh( new THREE.CubeGeometry( 300, 300, 300, 7, 7, 7 ), new THREE.MeshFaceMaterial( materials ) );
	mesh.scale.x = - 1;
	scene.add( mesh );
	
	// LIGHTING
	
	var light = new THREE.PointLight(0xEEEEEE);
	light.position.set(-20, 0, 20);
	light.intensity = 1;
	scene.add(light);
	
	var light2 = new THREE.PointLight(0xEEEEEE);
	light2.position.set(20, 0, 20);
	light2.intensity = .8;
	scene.add(light2);
	
	var light3 = new THREE.PointLight(0xEEEEEE);
	light3.position.set(10, 0, -20);
	light3.intensity = .5;
	scene.add(light3);
	
	// DRAW ANNOTATION LINES
	
	annotationLines.fuselage = drawLine([0,-1,3.8],[0,-1,-4],false);
  scene.add(annotationLines.fuselage);
  
	annotationLines.wingspan = drawLine([3.9,-1,-.5],[-3.9,-1,-.5],false);
	scene.add(annotationLines.wingspan);
	
	// LOAD STUFF
  var loader = new THREE.ColladaLoader();
	
	// load plane model
	loader.load('models/airbus-a350-800-man-repos.dae', function (result) {
		//readyCallback
		$("#progress").removeAttr("value");
		plane = result.scene;
		scene.add(plane);
		$("#progress").remove();
	}, function (result) {
		//progressCallback
		$("#progress").attr("value",result.loaded);
		$("#progress").attr("max",result.total);
	});
	
	// load plane model
	loader.load('models/text-rastered.dae', function (result) {
		//readyCallback
		text3d = result.scene;
		text3d.scale.set(0.3, 0.3, 0.3);
		
		//wingspan
		text3d.children[0].position.set(-6,-4,-2); 
		
    //length
		text3d.children[1].rotation.set(-Math.PI/2,0,0); 
		text3d.children[1].position.set(2,4,-4);
		
		//width
		text3d.children[2].rotation.set(0,-Math.PI/2,0); 
		text3d.children[2].position.set(0,-4,0);
				
		annotationsVisibility(false);
		
		scene.add(text3d);
	}, function (result) {
		//progressCallback
	});
	
	// from three.js/examples/webgl_interactive_cubes.html
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	window.addEventListener( 'resize', onWindowResize, false );

}

function annotationsVisibility(boolmeonce) {
		text3d.children[0].visible = boolmeonce;
		text3d.children[1].visible = boolmeonce;
		text3d.children[2].visible = boolmeonce;
		annotationLines.fuselage.visible = boolmeonce;
		annotationLines.wingspan.visible = boolmeonce;
}

function drawLine(from, to, visible) {
  var material = new THREE.LineBasicMaterial({ color: 0xffffff });
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(from[0], from[1], from[2]));
  geometry.vertices.push(new THREE.Vector3(to[0], to[1], to[2]));
  var newLine = new THREE.Line(geometry, material);
  newLine.visible = visible;
  return newLine;
}

/*
function buildLine(key) {
	var material = new THREE.LineBasicMaterial({ color: 0x000000 });
	var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 25, 0));
    geometry.vertices.push(new THREE.Vector3(annotations[key].coords[0], annotations[key].coords[1], annotations[key].coords[2]));
    var newLine = new THREE.Line(geometry, material);
    newLine.visible = false;
    return newLine;
}
function setAnnotation(key) {
	annotationLines["fuselage"].visible = false;
	annotationLines["tail"].visible = false;
	annotationLines["cockpit"].visible = false;
	annotationLines[key].visible = true;
	$("#annie").html(annotations[key].annotation);
}
*/

// animation loop
function animate() {

	// loop on request animation loop
	// - it has to be at the begining of the function
	// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	requestAnimationFrame( animate );
	
	// ?
	controls.update();
	
	// do the render
	render();

	// update stats
	stats.update();
}

// render the scene
function render() {

	// rotate the camera around the centerpoint, on the ground plane
	if(!mouseDown) {
		theta += 0.3;
		camera.position.x = radius * Math.cos( THREE.Math.degToRad( theta ) );
		camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
		camera.lookAt( scene.position );
	}
	
	TWEEN.update();
	camera.lookAt( scene.position );
	
	// actually render the scene
	renderer.render( scene, camera );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onDocumentMouseDown( event ) {
	mouseDown = true;
}

// for skybox
function loadTexture( path ) {

	var texture = new THREE.Texture( texture_placeholder );
	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );

	var image = new Image();
	image.onload = function () {

		texture.image = this;
		texture.needsUpdate = true;

	};
	image.src = path;

	return material;

}

$("#top").on("click", function(e) {	
	newCameraPosition = {x:0,y:15,z:1};
	new TWEEN.Tween( camera.position ).to( newCameraPosition, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#annotations").html(annotations.top.annotation);
	annotationsVisibility(true);
});

$("#nose").on("click", function(e) {
	newCameraPosition = {x:0,y:0,z:7};
	new TWEEN.Tween( camera.position ).to( newCameraPosition, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#annotations").html(annotations.nose.annotation);	
	annotationsVisibility(true);
});

$("#tail").on("click", function(e) {
	newCameraPosition = {x:0,y:0,z:-7};
	new TWEEN.Tween( camera.position ).to( newCameraPosition, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#annotations").html(annotations.tail.annotation);
	annotationsVisibility(true);
});

$("#side").on("click", function(e) {
	newCameraPosition = {x:-10,y:0,z:0};
	new TWEEN.Tween( camera.position ).to( newCameraPosition, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#annotations").html(annotations.side.annotation);
	annotationsVisibility(true);
});

$("#engine").on("click", function(e) {
	newCameraPosition = {x:2.5,y:-.5,z:2.5};
	new TWEEN.Tween( camera.position ).to( newCameraPosition, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#annotations").html(annotations.engine.annotation);
	annotationsVisibility(true);
});