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
		//renderer.setClearColorHex( 0xBBBBBB, 1 );
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
	camera.position.set(-30,-30,0);
	camera.up = new THREE.Vector3(0,0,1);
	camera.lookAt(new THREE.Vector3(0,0,0));
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

	// here you add your objects
	// - you will most likely replace this part by your own
	/*
	var geometry	= new THREE.TorusGeometry( 1, 0.42 );
	var material	= new THREE.MeshNormalMaterial();
	var mesh	= new THREE.Mesh( geometry, material );
	scene.add( mesh );
	*/
	
	// Create lights
	var light = new THREE.PointLight(0xEEEEEE);
	light.position.set(20, 0, 20);
	light.intensity = 1;
	scene.add(light);
	
	var light2 = new THREE.PointLight(0xEEEEEE);
	light2.position.set(-20, 0, -20);
	light2.intensity = 0.5;
	scene.add(light2);
	
	var loader = new THREE.ColladaLoader();
	loader.load('models/airbus-a350-800.dae', function (result) {
		plane = result.scene;
		scene.add(plane);
	});
}

// animation loop
function animate() {

	// loop on request animation loop
	// - it has to be at the begining of the function
	// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	requestAnimationFrame( animate );
	
	//plane.rotation.x += 0.01;
	//plane.rotation.z += 0.01;
	
	// do the render
	render();

	// update stats
	stats.update();
}

// render the scene
function render() {

	// update camera controls
	//cameraControls.update();

	// actually render the scene
	renderer.render( scene, camera );
}