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
var camera, cameraControls;
var plane;

var camera, scene, projector, raycaster, renderer;

var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 75, theta = 0;

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
	camera.position.set(-50,-50,0);
	camera.up = new THREE.Vector3(0,0,1);
	camera.lookAt(scene.position);
	scene.add(camera);

	// create a camera contol
	//cameraControls	= new THREEx.DragPanControls(camera)

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
	material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );	
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
	loader.load('models/airbus-a350-800.dae', function (result) {
		plane = result.scene;
		plane.position.set(-32,-20,-5);
		scene.add(plane);
	});
	
	/*
	loader = new THREE.JSONLoader();
    loader.load( "models/centered.json", function( geometry ) {
        mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
        mesh.scale.set( 10, 10, 10 );
        mesh.position.y = 0;
        mesh.position.x = 0;
        scene.add( mesh );
    } );
    */
}

// animation loop
function animate() {

	// loop on request animation loop
	// - it has to be at the begining of the function
	// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	requestAnimationFrame( animate );
	
	//plane.rotation.x += 0.01;
	//plane.rotation.z += 0.01;
	//camera.rotation.y += 0.01;
	
	// do the render
	render();

	// update stats
	stats.update();
}

// render the scene
function render() {

	// update camera controls
	//cameraControls.update();
	
	theta += 0.3;

	camera.position.x = radius * Math.cos( THREE.Math.degToRad( theta ) );
	camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.lookAt( scene.position );
	console.log(scene.position);

	// actually render the scene
	renderer.render( scene, camera );
}