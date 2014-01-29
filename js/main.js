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
var camera, controls;
var plane;

var camera, scene, projector, raycaster, renderer;

var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 75, theta = 0;

var annotationLines = new Object();
var highlighted = "";
var annotations = {
	"cockpit": {
		"annotation": "The cockpit's the room where pilots and navigator sit, but that's not important right now.",
		"coords": [0, -25, 5]
		},
	"fuselage": {
		"annotation": "The fuselage seats four people, or six children. It looks like a big Tylenol.",
		"coords": [0, 0, 5]
		},
	"tail": {
		"annotation": "The tail is larger than the tails of most monkeys.",
		"coords": [0, 20, 10]
		},
	"left turbine": {
		"annotation": "The left turbine, manufactured by GE, produces like a million pounds of thrust.",
		"coords": [10, -10, 0]
		},    	
	"right turbine": {
		"annotation": "The right turbine, manufactured by GE, produces like a million pounds of thrust.",
		"coords": [10, 10, 0]
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

	// put a camera in the scene
	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(0,0,5);
	//camera.up = new THREE.Vector3(0,0,1);
	//camera.lookAt(scene.position);
	scene.add(camera);

	// create a camera contol
	// cf. view-source:http://threejs.org/examples/misc_controls_orbit.html
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );

	// transparently support window resize
	THREEx.WindowResize.bind(renderer, camera);
	// allow 'p' to make screenshot
	THREEx.Screenshot.bindKey(renderer);
	// allow 'f' to go fullscreen where this feature is supported
	if( THREEx.FullScreen.available() ){
		THREEx.FullScreen.bindKey();		
	}

	// for reference, cube at center
	/*
	geometry = new THREE.CubeGeometry( 10, 10, 10 );
	//material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );
	//mesh = new THREE.Mesh( geometry, material );
	mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
	scene.add( mesh );	
	*/
	/*
	// fuselage
	geometry = new THREE.CubeGeometry( 10, 40, 10 );
	material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true, visible:false } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(0,0,0);
	mesh.name = "fuselage";
	scene.add( mesh );	

	// cockpit
	geometry = new THREE.CubeGeometry( 10, 10, 10 );
	material = new THREE.MeshBasicMaterial( { color: 0xff00ff, wireframe: true, visible:false } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(0,-25,0);
	mesh.name = "cockpit";
	scene.add( mesh );

	// tail	
	geometry = new THREE.CubeGeometry( 10, 10, 20 );
	material = new THREE.MeshBasicMaterial( { color: 0xaaffaa, wireframe: true, visible:false } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(0,25,5);
	mesh.name = "tail";
	scene.add( mesh );
	*/
	
	//annotations line
    //scene.add(annotationLine);
    /*
    annotationLines.fuselage = buildLine("fuselage");
    annotationLines.cockpit = buildLine("cockpit");
    annotationLines.tail = buildLine("tail");
    
    scene.add(annotationLines.fuselage);
    scene.add(annotationLines.cockpit);
    scene.add(annotationLines.tail);
		*/
	// Create lights
	
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
	
	
	var loader = new THREE.ColladaLoader();
	loader.load('models/a350-repositioned.dae', function (result) {
		//console.log(result);
		plane = result.scene;
		//plane.position.set(-32,-30,-5);
		
		// dude i cannot figure out orientation
		// i feel like i'm buried by snow in an avalanche and can't tell which way to dig
		// (#snowfall)
		/* var xAxis = new THREE.Vector3(1,0,0);
		rotateAroundWorldAxis(mesh, xAxis, Math.PI / 2);*/
		//console.log(plane);
		scene.add(plane);
	});
	
	
	// from three.js/examples/webgl_interactive_cubes.html
	projector = new THREE.Projector();
	raycaster = new THREE.Raycaster();
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	window.addEventListener( 'resize', onWindowResize, false );

}

function buildLine(key) {
	var material = new THREE.LineBasicMaterial({ color: 0x000000 });
	var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 0, 25));
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

	// update camera controls
	//cameraControls.update();
	
	// rotate the camera around the centerpoint, on the ground plane
	//theta += 0.3;
	//camera.position.x = radius * Math.cos( THREE.Math.degToRad( theta ) );
	//camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
	//camera.lookAt( scene.position );



	// find intersections

	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	projector.unprojectVector( vector, camera );

	raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {

		if ( INTERSECTED != intersects[ 0 ].object ) {

			if ( INTERSECTED ) { 
				//INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				console.log("INTERSECTED!");
			}
			
			var key = intersects[ 0 ].object.name;
			setAnnotation(key);
			
			INTERSECTED = intersects[ 0 ].object;
			//INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			//INTERSECTED.material.emissive.setHex( 0xff0000 );

		}

	} else {

		if ( INTERSECTED ) {
			//INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			console.log("INTERSECTED 2!");
		}

		INTERSECTED = null;

	}
	



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


// Rotation functions by Cory Gross
// http://stackoverflow.com/a/11060965/120290

// Rotate an object around an arbitrary axis in object space
var rotObjectMatrix;
function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setEulerFromRotationMatrix(object.matrix);
}

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    //  rotWorldMatrix.multiply(object.matrix);
    // new code for Three.JS r55+:
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply

    object.matrix = rotWorldMatrix;

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setFromRotationMatrix(object.matrix);
}
