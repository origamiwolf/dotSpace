/* scripts for visualisation */
var camera, controls, scene, renderer;				
var particles, pMaterial, particleSystem;
var animation_id;
var rotate_view = false;

// initialising new objects
// this should only be called once
function setup() {
  if (!camera) {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  }
  if (!controls) {
    controls = new THREE.TrackballControls(camera);  
  }
  if (!scene) {
    scene = new THREE.Scene();     
  }
  if (!renderer) {
    renderer = new THREE.WebGLRenderer();
  }
}

// what runs when a picture item is picked
function switchPic(picNum) {
  // this should not trigger but just in case
  if ((picNum >= picfiles.length) || (picNum < 0)) {
    picNum = 0;
  }
  // perform cleanup and scene reset
  cancelAnimationFrame(animation_id);
  init_scene();
  // show picture metadata
  show_info(picNum);
  // run the visualisation
  runViz("data/" + picfiles[picNum].ID + ".csv");
  animate();
}

// load data and run visualisation
function runViz(filename) {
  init_geoms();
  d3.csv(filename, function(data) { 				
    genCloud(data);
  });
}

// setting up texture and particle system
function init_geoms() {
  scene.remove(particleSystem);
  // cleanup first
  if (particles) particles.dispose();
  if (pMaterial) pMaterial.dispose();
  if (pTexture) pTexture.dispose();
  particleSystem = null;
        
  var pTexture = new THREE.TextureLoader().load("images/particleB.png");        
  particles = new THREE.Geometry();
  pMaterial = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    size: 1,
    map: pTexture,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  particleSystem = new THREE.Points(particles,pMaterial);
}

// loading data as particles
function genCloud(df,jitter=true) {
  var particleCount = df.length;
	for (var p=0;p<df.length;p++) {
    pRed = (jitter ? Math.round(2*Math.random() - 1) : 0) + parseInt(df[p].color.substr(0,2),16);
		pGreen = (jitter ? Math.round(2*Math.random() - 1) : 0) + parseInt(df[p].color.substr(2,2),16);
		pBlue = (jitter ? Math.round(2*Math.random() - 1) : 0) + parseInt(df[p].color.substr(4,2),16);

		var particle = new THREE.Vector3(pRed, pGreen, pBlue);
		particles.vertices.push(particle);
		particles.colors.push(new THREE.Color("#"+df[p].color));
    particle = null;
	}
		particleSystem.sortParticles = true;
		particles.center();
    scene.add(particleSystem);
}

// sets up the scene
function init_scene() {
  var container = document.getElementById("mainViz");

  // clean up existing stuff
  while (container.hasChildNodes()) {
    container.removeChild(container.lastChild);
  }

  // camera parameters
  camera.position.set(50,-250,-125);
  camera.up.set(0,1,0);
  camera.lookAt(new THREE.Vector3(0,0,0));

  // control parameters
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.addEventListener('change', render);
  controls.target.set(0,0,0);

  // renderer parameters
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize( 0.8*window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  
  // particle system parameters
  if (particleSystem) {
    particleSystem.rotation.x = 0;
    particleSystem.rotation.y = 0;
    particleSystem.rotation.z = 0;
  }
}

// toggle auto-rotation
function rotate_model() {
  if (rotate_view) {
    rotate_view = false;
  } else {
    rotate_view = true;
  }
}

// animation of model
function animate() {
  animation_id = requestAnimationFrame(animate);		
  if (rotate_view && particleSystem) {
    particleSystem.rotation.x += 0.001;
    particleSystem.rotation.y += 0.003;
    particleSystem.rotation.z += 0.005;
  }
  render();
  controls.update();
}

// render call
function render() {
  renderer.render(scene, camera);
}

// keyboard listeners
function onKeyDown(event) {
  if (event.keyCode == 82) {
    init_scene();
  }
  if (event.keyCode == 83) {
    rotate_model();
  }
}      

// informational functions
function show_info(picNum) {
  var pic_info;
  pic_info = '<i>' + picfiles[picNum].Title + '</i><br>';
  pic_info = pic_info + picfiles[picNum].Artist;
  pic_info = pic_info + ' (' + picfiles[picNum].Year + ')' + '<br>';
  pic_info = pic_info + 'Source: ' + picfiles[picNum].Source + '<br>';
  pic_info = pic_info + parseInt(picfiles[picNum].Pixels).toLocaleString() + ' pixels' + '<br>';
  pic_info = pic_info + parseInt(picfiles[picNum].Uniques).toLocaleString() + ' unique colours';
  document.getElementById("pic_info").innerHTML = pic_info;
  document.getElementById("pic_thumb").innerHTML = '<img id="thumb" src=data/' + picfiles[picNum].ID + '_thumb.jpg>';
}

function about() {
  // stop any animation calls if running
  cancelAnimationFrame(animation_id);
  
  // sidebar info
  var about_info;
  about_info = 'In this visualisation, the RGB colour information of each pixel in a painting is mapped onto a'; 
  about_info = about_info + ' three dimensional Cartesian space, with the axes representing the red, blue and green channels.';
  about_info = about_info + '<br><br>';
  about_info = about_info + 'By no means does this represent the true colourspace of the original painting.  Colour artefacts ';
  about_info = about_info + 'will most certainly arise from the transcription of a realspace painting into a digital format, ';
  about_info = about_info + 'introduced by the type of photography equipment used, the imaging conditions and the digital storage format.';
  about_info = about_info + '<br><br>';
  about_info = about_info + 'Not only that, but physical changes in pigments, varnishes and media will over time result in colour drifts from the original as well.';
  document.getElementById("pic_info").innerHTML = about_info;
  document.getElementById("pic_thumb").innerHTML = '';
        
  // main panel info
  var container = document.getElementById("mainViz");
  while (container.hasChildNodes()) {
    container.removeChild(container.lastChild);
  }
  var panel_one = document.createElement('div');
  panel_one.setAttribute('id','splash_div');
  var main_img = document.createElement('img');
  main_img.setAttribute('id','splash');
  main_img.setAttribute('title','Click on a painting link above to begin.');
  main_img.setAttribute('src','images/splash.png');
  panel_one.appendChild(main_img);
  container.appendChild(panel_one);
    
  var panel_two = document.createElement('div');
  panel_two.setAttribute('id','footer');
  panel_two.innerHTML = "<a href='https://github.com/origamiwolf/dotSpace'>dotSpace</a> is maintained by <a href='https://origamiwolf.github.io/'>origamiwolf</a>";
  container.appendChild(panel_two);

}

function displayMenu() {
  var menu_info = '';
  for (var i=0;i<picfiles.length;i++) {
    var anchor_node, anchor_text;
    anchor_node = document.createElement("a");
    anchor_node.setAttribute('onclick', 'switchPic(' + picfiles[i].ID + ')');
    anchor_text = menu_info + picfiles[i].Shortname;
    anchor_node.appendChild(document.createTextNode(anchor_text));
    document.getElementById('menu').appendChild(anchor_node);
    if (i<picfiles.length-1) {
      document.getElementById('menu').appendChild(document.createTextNode(' | '));
    }
    anchor_node = null;          
  }
}


