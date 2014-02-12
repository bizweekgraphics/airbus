/* COORDINATE SYSTEM:
x+: plane to its left
y+: plane altitude up
z+: plane forward
*/

var stats, scene, renderer;
var camera, controls, lastCameraPosition;
var plane, skybox, text3d; //will be loaded from .dae (collada) files

var camera, scene, projector, raycaster, renderer;

var mouse = new THREE.Vector2(), INTERSECTED;

// for camera wander
var initCam = {"x": -4, "y": 2, "z": 8};
var dimensions = ["x","y","z"], orbitPlane = ["x","y"], orbitFixed = ["z"];
var radius = 7, theta = 0, dtheta = 0.3;

var wander = true;
var wanderTimeout;
var wanderTimeoutLength = 1000*30;

// vestigial :-/ unless i resurrect it for gentle wobble!
var animating, t = 0; // for animating plane along path

var annotationLines = new Object();

var overlayIndex = 0;
var overlayInterval;
var overlayIntervalLength = 1000*5;
var overlays = [
  { "notes": "Airbus created a digital mock-up of the A350 that every engineer working on the airplane can use at any time.", 
	  "img": "dmu.gif",
	  "src": "http://videos.airbus.com/video/dc6bd25e7f3s.html" },
  { "notes": "The A350 airframe is Airbus’s first to be built mostly (53 percent) of composite materials." },
	{ "notes": "Tests to determine the strength of the airplane’s structure proceed until a wing is wrenched from the fuselage.", 
	  "img": "wing-warp.gif",
		"src": "http://www.youtube.com/watch?v=B74_w3Ar9nI" },
	{ "notes": "Bare of seats and internal fittings, the first flight-test airplane carries dozens of Jacuzzi-sized water jugs to bulk it up to operating weight." },
  { "notes": "During potentially hazardous test flights, crew wear parachutes and are prepared to bail out through an explosive hatch.", 
	  "img": "" },
	{ "notes": "During the VMU (for velocity minimum unstick) test, the pilot raises the nose so sharply during the takeoff roll that the tail hits the ground.",
	  "src": "http://www.youtube.com/watch?v=_qKo7Pa8wgI" },
	{ "notes": "To earn certification from the FAA and its European counterpart, a test plane must fly into stormy weather until substantial ice accumulates on its surface.",
	  "src": "http://videos.airbus.com/video/iLyROoafIlQ2.html" },
	{ "notes": "The A350 is designed to fly safely for up to seven hours on one engine." },
	{ "notes": "During ground tests, planes taxi at high speed through giant puddles to see if the spray causes the engines to fail. (A380 shown here.)", 
	  "img": "splashy.gif",
		"src": "http://videos.airbus.com/video/iLyROoafIlby.html" },
	{ "notes": "An A350 front fuselage in final assembly at Airbus’s huge facility in Toulouse, France.", 
	  "img": "" },
	{ "notes": "Curved winglets reduce the drag caused by vortices slipping off the end of the wing and increase fuel efficiency." },
	{ "notes": "All but the first five A350 test aircraft will eventually be refitted and sold to airlines." }
	];
// bloomberg news video! http://www.youtube.com/watch?v=bEOJajCuwKE

if(inIframe()) {
  $("body").css("background","url(img/static.png)");
  $("body").css("background-size","cover");
  $("#logo, #sidebar, #load-progress, #colophon").hide();
  $("#popout, #enable").show();
} else {
  if( !init() )	animate();
}

$("#enable").click(function() {
  $("#load-progress").show();
  $("#enable").hide();
  if( !init() )	animate();
});

console.log("Recommended listening: \n http://youtu.be/AjzcdvF3gDc?t=3m48s \n http://youtu.be/mGF_0AcHaGs \n http://youtu.be/kn6-c223DUU \n http://youtu.be/eF-4Cr9Iy_8");

//////////////////////////////////////////////////////////////////////////////////////////
// INITIALIZE THE SCENE //////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

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
	}else{
		//Detector.addGetWebGLMessage();
		$("#no-webgl").show();
		$("#sidebar").hide();
		$("#load-progress").hide();
		return true;
	}
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById('container').appendChild(renderer.domElement);

	// add Stats.js - https://github.com/mrdoob/stats.js
	stats = new Stats();
	stats.domElement.style.position	= 'absolute';
	stats.domElement.style.bottom	= '0px';
	stats.domElement.style.display = 'none';
	document.body.appendChild( stats.domElement );

	// create a scene
	scene = new THREE.Scene();

	/// CAMERA ///
	
	// place camera in scene
	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(initCam.x,initCam.y,initCam.z);
	//camera.up = new THREE.Vector3(0,0,1);
	camera.lookAt(scene.position);
	scene.add(camera);

	// create a camera control
	// cf. view-source:http://threejs.org/examples/misc_controls_orbit.html
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
  controls.minDistance = 2;
  controls.maxDistance = 100;
  
	// transparently support window resize
	THREEx.WindowResize.bind(renderer, camera);
  
	/* REFERENCE CUBE
	geometry = new THREE.CubeGeometry( 1, 1, 1 );
	material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh ); */
	
	/// SKYBOX ///
	
	texture_placeholder = document.createElement( 'canvas' );
	texture_placeholder.width = 128;
	texture_placeholder.height = 128;

	var context = texture_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );
  
  var skyboxDir = "skybox-cloudy";
  
	var materials = [

		loadTexture( 'img/'+skyboxDir+'/px.jpg' ), // right
		loadTexture( 'img/'+skyboxDir+'/nx.jpg' ), // left
		loadTexture( 'img/'+skyboxDir+'/py.jpg' ), // top
		loadTexture( 'img/'+skyboxDir+'/ny.jpg' ), // bottom
		loadTexture( 'img/'+skyboxDir+'/pz.jpg' ), // back
		loadTexture( 'img/'+skyboxDir+'/nz.jpg' )  // front

	];

	skybox = new THREE.Mesh( new THREE.CubeGeometry( 300, 300, 300, 7, 7, 7 ), new THREE.MeshFaceMaterial( materials ) );
	skybox.scale.x = - 1;
	scene.add( skybox );
	
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
		
	// 3D ANNOTATIONS
	annotationLines.fuselage = drawLine([0,-1,3.8],[0,-1,-4],false);
  scene.add(annotationLines.fuselage);
  
	annotationLines.wingspan = drawLine([3.9,-1,-.5],[-3.9,-1,-.5],false);
	scene.add(annotationLines.wingspan);
	
	// LOAD STUFF
  var loader = new THREE.ColladaLoader();
	
	// load plane model
	loader.load('models/airbus-a350-900-repos.dae', function (result) {
		
		// once plane has loaded
		plane = result.scene;
		scene.add(plane);
		$("#load-progress").remove();
		
    // 2D OVERLAY
    overlayInterval = setInterval(updateOverlay,overlayIntervalLength);

	}, function (result) {
		// as plane loads
	});
	
	// load 3d text annotations
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
	$("#container").on("mousedown", onDocumentMouseDown);
	window.addEventListener( 'resize', onWindowResize, false );

}

//////////////////////////////////////////////////////////////////////////////////////////
// CORE RENDER LOOP //////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

// animation loop
function animate() {

	// loop on request animation loop
	// - it has to be at the begining of the function
	// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	requestAnimationFrame( animate );
	
	// ?
	controls.update();
	
	if(animating) {
    animatePlane();
	}
	
	// do the render
	render();

	// update stats
	stats.update();
}

// render the scene
function render() {

	// rotate the camera around the centerpoint, on the ground plane
	if(wander) { orbitRand(); }
	
	TWEEN.update();
	camera.lookAt( scene.position );
	
	// actually render the scene
	renderer.render( scene, camera );
}

//////////////////////////////////////////////////////////////////////////////////////////
// SCENE CONTROL /////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

function shuffleOrbit() {
  orbitPlane = dimensions.slice(0);
  orbitFixed = orbitPlane.splice(Math.floor(Math.random()*3), 1);
  radius = Math.random()*5+5;
  camera.position[orbitFixed[0]] = Math.random()*40-20;
  wander = true;
}

function orbitZ() {
  theta += dtheta;
  camera.position.x = radius * Math.cos( THREE.Math.degToRad( theta ) );
  camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.lookAt( scene.position );
}

function orbitRand() {
  theta += dtheta;
  orbitPlane.forEach(function(d,i) {
    if(i) {
      camera.position[d] = radius * Math.cos( THREE.Math.degToRad( theta ) );
    } else { 
      camera.position[d] = radius * Math.sin( THREE.Math.degToRad( theta ) );  
    }
  });
  camera.lookAt( scene.position );
}

function updateOverlay() {
  //var i = Math.floor(Math.random()*overlays.length);
  var css = {"left": (Math.floor(Math.random()*60)+20)+"%", "top": (Math.floor(Math.random()*60)+20)+"%"};
  var html = overlays[overlayIndex].notes;
  if(overlays[overlayIndex].img) {
    html += '<img src="img/overlays/'+overlays[overlayIndex].img+'" width="100%">';
  }
  $("#overlay").fadeOut(300, function() { 
    // do this when fade out finishes 
    $("#overlay").css(css);
    $("#overlay").html(html);
    $("#overlay").fadeIn();
    overlayIndex = (overlayIndex+1) % overlays.length;
  });
}

//////////////////////////////////////////////////////////////////////////////////////////
// EVENTS ////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

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
	wander = false;
	wanderTimeout = setTimeout(function() { wander = true; }, wanderTimeoutLength);
}

//////////////////////////////////////////////////////////////////////////////////////////
// HELPERS ///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

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

// from http://stackoverflow.com/a/326076/120290
function inIframe() {
  try {
    return window.self !== window.top;
  } catch(err) {
    return true;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
// VESTIGIAL /////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// (currently unused) /////////

$("#explore-block .tab").on("click", function(e) {
  var key = $(this).attr("id");
	if($(this).hasClass("active")) {
	  wander = true;
	  $(this).removeClass("active");
    $("#explore-notes").hide();
	} else {
	  $(".tab").removeClass("active");
	  $(this).addClass("active");
	  wander = false;
    new TWEEN.Tween( camera.position ).to( views[key].camera, 200 )
            .easing( TWEEN.Easing.Quadratic.Out).start();
    $("#explore-notes").css(views[key].css);
    $("#explore-notes").show();
    $("#explore-notes").html(views[key].notes);
    annotationsVisibility(true);  
	}
});

//animates the plane along a sine wave
function animatePlaneDemo() {
  var c=0.1; //scale factor
  plane.position.set(0,10*Math.sin(c*t),t);
  //plane.rotation.set(-Math.PI/4,0,0); //tilts plane nose-up by 45deg
  plane.rotation.set(-10*c*Math.cos(c*t),0,0);
  t += 0.25;
}

$("#wireframe").on("click", function(e) {
  plane.traverse(function ( child ) {
    //irreversible
    child.material = new THREE.MeshBasicMaterial( { wireframe: true } );    
  } );
});

$("#nobg").on("click", function(e) {
  scene.remove(skybox);
});

// Convert Excel dates into JS date objects
// @author https://gist.github.com/christopherscott/2782634
// @param excelDate {Number}
// @return {Date}
function getDateFromExcel(excelDate) {
  // 1. Subtract number of days between Jan 1, 1900 and Jan 1, 1970, plus 1 (Google "excel leap year bug")             
  // 2. Convert to milliseconds.
	return new Date((excelDate - (25567 + 1))*86400*1000);
}
