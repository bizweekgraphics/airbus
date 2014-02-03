/* COORDINATE SYSTEM:
x+: plane to its left
y+: plane altitude up
z+: plane forward
*/

var stats, scene, renderer;
var camera, controls, lastCameraPosition;
var plane, text3d; //will be loaded from .dae (collada) files

var camera, scene, projector, raycaster, renderer;

var mouseDown = false;
var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 7, theta = 0; // for onload camera wander
var animating, t = 0; // for animating plane along path

var annotationLines = new Object();
var views = {
	"nose": {
		"notes": "The cockpit's the room where pilots and navigator sit, but that's not important right now. Interior pic goes here.",
		"camera": {x:0,y:0,z:7}
		},
	"side": {
		"notes": "The fuselage seats four people, or six children. It looks like a big Tylenol.",
		"camera": {x:-7.5,y:0,z:0}
		},
	"tail": {
		"notes": "The tail is larger than the tails of most monkeys.",
		"camera": {x:0,y:0,z:-7}
		},
	"top": {
		"notes": "With a wingspan of 213 feet, the Airbus is, like, pretty wide. TK TK TK blah blah hello.",
		"camera": {x:0,y:15,z:1}
		},    	
	"engine": {
		"notes": "The twin Rolls-Royce Trent XWB turbofans produce like a million pounds of thrust each. Roughly.",
		"camera": {x:2.5,y:-.5,z:2.5}
		}
	};

var data = {
  "stock": {
    "notes": "Airbus stock blah blah...",
		"camera": {x:-200,y:0,z:0}
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

	/// CAMERA ///
	
	// place camera in scene
	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(-4,2,8);
	//camera.up = new THREE.Vector3(0,0,1);
	camera.lookAt(scene.position);
	scene.add(camera);

	// create a camera control
	// cf. view-source:http://threejs.org/examples/misc_controls_orbit.html
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );

	// transparently support window resize
	THREEx.WindowResize.bind(renderer, camera);

	/* REFERENCE CUBE
	geometry = new THREE.CubeGeometry( 1, 1, 1 );
	material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh ); */
	
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
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	window.addEventListener( 'resize', onWindowResize, false );

}

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

$("#view-block .tab").on("click", function(e) {
  var key = $(this).attr("id");
	new TWEEN.Tween( camera.position ).to( views[key].camera, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#view-notes").html(views[key].notes);
	annotationsVisibility(true);  
});

$("#data-block .tab").on("click", function(e) {
  var key = $(this).attr("id");
  
  $.getScript("data/data-shareprice.js", function(){
     console.log(sharePrice);
  });
  
	new TWEEN.Tween( camera.position ).to( data[key].camera, 200 )
					.easing( TWEEN.Easing.Quadratic.Out).start();
	$("#data-notes").html(data[key].notes);
	annotationsVisibility(false);  
	animating = true;
});


function animatePlane() {
  var domain = [0,10];
  var range = [0,10];
  var dpf = 1; //points of data per frame of animation
  
  if(typeof sharePrice !== "undefined" && t<sharePrice.length-1) {
    plane.position.set(0,sharePrice[Math.floor(t)].smavg,t);
    plane.rotation.set(-Math.atan(sharePrice[Math.floor(t+1)].smavg-sharePrice[Math.floor(t)].smavg),0,0);
    t += dpf;
  }
}

//animates the plane along a sine wave
function animatePlaneDemo() {
  var c=0.1; //scale factor
  plane.position.set(0,10*Math.sin(c*t),t);
  //plane.rotation.set(-Math.PI/4,0,0); //tilts plane nose-up by 45deg
  plane.rotation.set(-10*c*Math.cos(c*t),0,0);
  t += 0.25;
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

// Convert Excel dates into JS date objects
// @author https://gist.github.com/christopherscott/2782634
// @param excelDate {Number}
// @return {Date}
function getDateFromExcel(excelDate) {
  // 1. Subtract number of days between Jan 1, 1900 and Jan 1, 1970, plus 1 (Google "excel leap year bug")             
  // 2. Convert to milliseconds.
	return new Date((excelDate - (25567 + 1))*86400*1000);
}