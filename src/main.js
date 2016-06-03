/*  
3D Experiment
=============

Experimental 3D App

(Shaun A. Noordin || shaunanoordin.com || 20160603)
********************************************************************************
 */

//THREE imported via index.html

/*  Primary App Class
 */
//==============================================================================
class App {
  constructor() {
    console.log("START");
    
    //Bind functions to 'this' reference.
    //--------------------------------
    this.run = this.run.bind(this);
    this.physics = this.physics.bind(this);
    this.paint = this.paint.bind(this);
    //--------------------------------

    //Initialise 3D Renderer
    //--------------------------------
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById("app").appendChild(this.renderer.domElement);
    //--------------------------------
    
    //Set up Scene
    //--------------------------------
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
    
    this.camera.position.z = 5;
    //--------------------------------

    //Start!
    //--------------------------------
    this.runCycle = setInterval(this.run, 1000 / FRAMES_PER_SECOND);
    //--------------------------------
  }
  
  run() {
    //Physics
    //--------------------------------
    this.physics();
    //--------------------------------
    
    //Visuals
    //--------------------------------
    this.paint();
    //--------------------------------
  }
  
  physics() {
  }
  
  paint() {
    this.renderer.render(this.scene, this.camera);
  }
}

const FRAMES_PER_SECOND = 50;
//==============================================================================

/*  Initialisations
 */
//==============================================================================
var app;
window.onload = function() {
  window.app = new App();
};
//==============================================================================
