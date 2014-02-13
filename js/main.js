/* COORDINATE SYSTEM:

Position:
x+: plane to its left
y+: plane altitude up
z+: plane forward

Rotation:
x+: pitch down
y+: yaw counterclockwise
z+: roll right

*/

var stats, scene, renderer;
var camera, controls, lastCameraPosition;
var plane, skybox;

var camera, scene, projector, raycaster, renderer;

var mouse = new THREE.Vector2(), INTERSECTED;

// for camera wander
var initCam = {"x": -4, "y": 2, "z": 8};
var dimensions = ["x","y","z"], orbitPlane = ["x","y"], orbitFixed = ["z"];
var radius = 7, theta = 0, dtheta = 0.3;

var wander = true;
var wanderTimeout;
var wanderTimeoutLength = 1000*30;

// for gentle rolling
var amp=0.1,
    animating = false,
    t = 0;

var overlayIndex = 0,
    overlayInterval,
    overlayIntervalLength = 1000*9,
    overlayDelay,
    overlayDelayLength = 1000*1,
    overlayFadeLength = 1000;
var overlays = [
  { "notes": "Airbus created a digital mock-up of the A350 that every engineer working on the airplane can use at any time.", 
	  "img": "dmu.gif",
	  "src": "http://videos.airbus.com/video/dc6bd25e7f3s.html" },
  { "notes": "The A350 airframe is Airbus’s first to be built mostly (53 percent) of composite materials." },
	{ "notes": "Tests to determine the strength of the airplane’s structure proceed until a wing is wrenched from the fuselage.", 
	  "img": "wing-warp.gif",
		"src": "http://www.youtube.com/watch?v=B74_w3Ar9nI" },
	{ "notes": "Bare of seats and internal fittings, the first flight-test airplane carries dozens of Jacuzzi-size water jugs to bulk it up to operating weight." },
  { "notes": "During potentially hazardous test flights, the crew wears parachutes and is prepared to bail out through an explosive hatch.", 
	  "img": "test-crew.jpg" },
	{ "notes": "During the VMU (velocity minimum unstick) test, the pilot raises the nose so sharply during the takeoff roll that the tail hits the ground.",
	  "src": "http://www.youtube.com/watch?v=_qKo7Pa8wgI" },
	{ "notes": "To earn certification from the Federal Aviation Administration and its European counterpart, a test plane must fly into stormy weather until substantial ice accumulates on its surface.",
	  "src": "http://videos.airbus.com/video/iLyROoafIlQ2.html" },
	{ "notes": "The A350 is designed to fly safely for up to seven hours on one engine." },
	{ "notes": "During ground tests, planes taxi at high speed through giant puddles to see if the spray causes the engines to fail. (A380 shown here.)", 
	  "img": "splashy.gif",
		"src": "http://videos.airbus.com/video/iLyROoafIlby.html" },
	{ "notes": "An A350 front fuselage in final assembly at Airbus’s huge facility in Toulouse, France.", 
	  "img": "fuselage.jpg" },
	{ "notes": "Curved winglets reduce the drag caused by vortexes slipping off the end of the wing and increase fuel efficiency." },
	{ "notes": "All but the first five A350 test aircraft will eventually be refitted and sold to airlines." }
	];
// bloomberg news video! http://www.youtube.com/watch?v=bEOJajCuwKE

if(inIframe()) {
  $("body").css("background","url(img/static.png)");
  $("body").css("background-size","cover");
  $("body").addClass("iframed");
  $("#logo, #hed, #load-progress, #colophon").hide();
  $("#popout, #enable").show();
  $("#controls").hide();
} else {
  if( !init() )	animate();
}

$("#enable").click(function() {
  $("#load-progress, #controls, #colophon").show();
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
	}else{
		//Detector.addGetWebGLMessage();
		$("#no-webgl").show();
		$("#hed, #load-progress, #colophon, #controls").hide();
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
  
	/// SKYBOX ///
	
	texture_placeholder = document.createElement( 'canvas' );
	texture_placeholder.width = 128;
	texture_placeholder.height = 128;

	var context = texture_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );
  
  var skyboxDir = "skybox-cloudy";
  var hour = new Date().getHours();
  if(hour<6) {
    $("body").addClass("dark_layout");
    skyboxDir = "skybox-night";
  } else if(hour<8) {
    $("body").addClass("dark_layout");
    skyboxDir = "skybox-sunset";
  } else if(hour<12) {
    skyboxDir = "skybox-cloudy";
  } else if(hour<18) {
    skyboxDir = "skybox-sunny";
  } else if(hour<20) {
    $("body").addClass("dark_layout");
    skyboxDir = "skybox-sunset";    
  } else {
    $("body").addClass("dark_layout");
    skyboxDir = "skybox-night";
  }
    
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
		
	// LOAD PLANE
  var loader = new THREE.ColladaLoader();
	loader.load('models/airbus-a350-900-repos.dae', function (result) {
		
		// once plane has loaded
		plane = result.scene;
		scene.add(plane);
		$("#load-progress").remove();
		animating = true;
		
    // 2D OVERLAY
    overlayInterval = setInterval(updateOverlay,overlayIntervalLength);

	}, function (result) {
		// as plane loads
		// (currently just one of those infinite progress bars, because this doesn't work well enough)
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
    //animatePlane();
    wobble();
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
  var css = {"left": (Math.floor(Math.random()*60)+20)+"%", "top": (Math.floor(Math.random()*60)+20)+"%"};
  var html = overlays[overlayIndex].notes;
  if(overlays[overlayIndex].src) {
    html += '<br/><a href="'+overlays[overlayIndex].src+'" target="_blank">Learn more <span class="glyphicon glyphicon-chevron-right"></span></a>';
  }
  if(overlays[overlayIndex].img) {
    html += '<img src="img/overlays/'+overlays[overlayIndex].img+'" width="100%">';
  }
  $("#overlay").fadeOut(overlayFadeLength, function() { 
    // do this when fade out finishes 
    $("#overlay").css(css);
    $("#overlay").html(html);
    overlayDelay = setTimeout(function() { $("#overlay").fadeIn(overlayFadeLength); }, overlayDelayLength);
    overlayIndex = (overlayIndex+1) % overlays.length;
  });
}

function wobble() {
  // x = pitch down
  // y = yaw counterclockwise
  // z = roll right
  plane.rotation.z = amp*Math.sin(t);
  t += 0.01;
}

//////////////////////////////////////////////////////////////////////////////////////////
// EVENTS ////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

$("#popout").click(function() {
   window.open('index.html','_blank');  
});

$("#hed").click(function() {
   window.open('iframe-container.html','_blank');  
});

$("#shuffle").click(function(e) {
  shuffleOrbit();
  $("#orbit-toggle").addClass("active");
  $("#orbit-toggle").find(".label").text("Orbit on");
});

$("#orbit-toggle").click(function(e) {
  if(wander) {
    wander = false;
    $(this).removeClass("active");
    $(this).find(".label").text("Orbit off");
  } else {
    wander = true;
    $(this).addClass("active");
    $(this).find(".label").text("Orbit on");
  }
});

$("#notes-toggle").click(function(e) {
  if($(this).hasClass("active")) {
    clearInterval(overlayInterval);
    $(this).removeClass("active");
    $(this).find(".label").text("Notes off");
    $("#overlay-container").hide();
  } else {
    $("#overlay-container").show();
    updateOverlay();
    overlayInterval = setInterval(updateOverlay,overlayIntervalLength);
    $(this).addClass("active");
    $(this).find(".label").text("Notes on");
  }
});

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