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
    //Bind functions to 'this' reference.
    //--------------------------------
    this.run = this.run.bind(this);
    this.physics = this.physics.bind(this);
    this.paint = this.paint.bind(this);
    this.addActor = this.addActor.bind(this);
    //--------------------------------
    
    //Prepare Input
    //--------------------------------
    this.keys = new Array(MAX_KEYS);
    for (let i = 0; i < this.keys.length; i++) {
      this.keys[i] = {
        state: INPUT_IDLE,
        duration: 0
      };
    }
    this.pointer = {
      start: { x: 0, y: 0 },
      now: { x: 0, y: 0 },
      state: INPUT_IDLE,
      duration: 0
    }
    //--------------------------------
    
    //Bind Events
    //--------------------------------
    /*if ("onmousedown" in this.canvas && "onmousemove" in this.canvas &&
        "onmouseup" in this.canvas) {
      this.canvas.onmousedown = this.onPointerStart.bind(this);
      this.canvas.onmousemove = this.onPointerMove.bind(this);
      this.canvas.onmouseup = this.onPointerEnd.bind(this);
    }    
    if ("ontouchstart" in this.canvas && "ontouchmove" in this.canvas &&
        "ontouchend" in this.canvas && "ontouchcancel" in this.canvas) {
      this.canvas.ontouchstart = this.onPointerStart.bind(this);
      this.canvas.ontouchmove = this.onPointerMove.bind(this);
      this.canvas.ontouchend = this.onPointerEnd.bind(this);
      this.canvas.ontouchcancel = this.onPointerEnd.bind(this);
    }*/
    if ("onkeydown" in window && "onkeyup" in window) {
      window.onkeydown = this.onKeyDown.bind(this);
      window.onkeyup = this.onKeyUp.bind(this);
    }
    if ("onresize" in window) {
      window.onresize = this.updateSize.bind(this);
    }
    this.updateSize();
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
    this.actors = [];
    this.addActor("PLANET", 0, 0, 0, 1);
    this.addActor("STAR", 0, 1, 0, 0.5);
    this.camera.position.z = 5;
    //--------------------------------

    //Start!
    //--------------------------------
    this.runCycle = setInterval(this.run, 1000 / FRAMES_PER_SECOND);
    //--------------------------------
  }
  
  //----------------------------------------------------------------
  
  run() {
    //Get User Input
    //--------------------------------
    let CAMERA_SPEED = 0.1;
    
    if (this.keys[KEY_CODES.UP].state === INPUT_ACTIVE && this.keys[KEY_CODES.DOWN].state !== INPUT_ACTIVE) {
      this.camera.position.z -= CAMERA_SPEED;
    } else if (this.keys[KEY_CODES.UP].state !== INPUT_ACTIVE && this.keys[KEY_CODES.DOWN].state === INPUT_ACTIVE) {
      this.camera.position.z += CAMERA_SPEED;
    }
    if (this.keys[KEY_CODES.LEFT].state === INPUT_ACTIVE && this.keys[KEY_CODES.RIGHT].state !== INPUT_ACTIVE) {
      this.camera.position.x -= CAMERA_SPEED;
    } else if (this.keys[KEY_CODES.LEFT].state !== INPUT_ACTIVE && this.keys[KEY_CODES.RIGHT].state === INPUT_ACTIVE) {
      this.camera.position.x += CAMERA_SPEED;
    }
    //--------------------------------
    
    //Physics
    //--------------------------------
    this.physics();
    //--------------------------------
    
    //Visuals
    //--------------------------------
    this.paint();
    //--------------------------------
    
    //Cleanup Input
    //--------------------------------
    if (this.pointer.state === INPUT_ENDED) {
      this.pointer.duration = 0;
      this.pointer.state = INPUT_IDLE;
    }
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i].state === INPUT_ACTIVE) {
        this.keys[i].duration++;
      } else if (this.keys[i].state === INPUT_ENDED) {
        this.keys[i].duration = 0;
        this.keys[i].state = INPUT_IDLE;
      }
    }
    //--------------------------------
  }
  
  //----------------------------------------------------------------
  
  physics() {
  }
  
  //----------------------------------------------------------------
  
  paint() {
    this.renderer.render(this.scene, this.camera);
  }
  
  //----------------------------------------------------------------
  
  addActor(type, x = 0, y = 0, z = 0, size = 1) {
    let newActor = new Actor();
    newActor.size = size;
    newActor.x = x;
    newActor.y = y;
    newActor.z = z;
    
    switch (type) {
      case "PLANET":
        newActor.geometry = new THREE.SphereGeometry(newActor.size / 2, 32, 32);
        newActor.material = new THREE.MeshBasicMaterial({color: 0x33cc66});
        break;
      case "STAR":
        newActor.geometry = new THREE.SphereGeometry(newActor.size / 2, 32, 32);
        newActor.material = new THREE.MeshBasicMaterial({color: 0xffee33});
        break;
      default:
        newActor.geometry = new THREE.BoxGeometry(newActor.size, newActor.size, newActor.size);
        newActor.material = new THREE.MeshBasicMaterial({color: 0xffee33});
        break;
    }
    
    newActor.mesh = new THREE.Mesh( newActor.geometry, newActor.material );
    this.actors.push(newActor);
    this.scene.add(newActor.mesh);
  }
  
  //----------------------------------------------------------------
  
  onPointerStart(e) {
    this.pointer.state = INPUT_ACTIVE;
    this.pointer.duration = 1;
    this.pointer.start = this.getPointerXY(e);
    this.pointer.now = this.pointer.start;
    return Utility.stopEvent(e);
  }
  
  onPointerMove(e) {
    if (this.pointer.state === INPUT_ACTIVE) {
      this.pointer.now = this.getPointerXY(e);
    }
    return Utility.stopEvent(e);
  }
  
  onPointerEnd(e) {
    this.pointer.state = INPUT_ENDED;
    //this.pointer.now = this.getPointerXY(e);
    return Utility.stopEvent(e);
  }
  
  getPointerXY(e) {
    let clientX = 0;
    let clientY = 0;
    if (e.clientX && e.clientY) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches.length > 0 && e.touches[0].clientX &&
        e.touches[0].clientY) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    let inputX = (clientX - this.boundingBox.left) * this.sizeRatioX;
    let inputY = (clientY - this.boundingBox.top) * this.sizeRatioY;
    return { x: inputX, y: inputY };
  }
  
  //----------------------------------------------------------------
  
  onKeyDown(e) {
    let keyCode = Utility.getKeyCode(e);    
    if (keyCode > 0 && keyCode < MAX_KEYS && this.keys[keyCode].state != INPUT_ACTIVE) {
      this.keys[keyCode].state = INPUT_ACTIVE;
      this.keys[keyCode].duration = 1;
    }  //if keyCode == 0, there's an error.
  }
  
  onKeyUp(e) {
    let keyCode = Utility.getKeyCode(e);    
    if (keyCode > 0 && keyCode < MAX_KEYS) {
      this.keys[keyCode].state = INPUT_ENDED;
    }  //if keyCode == 0, there's an error.
  }
  
  //----------------------------------------------------------------
  
  updateSize() {
    /*let boundingBox = (this.canvas.getBoundingClientRect)
      ? this.canvas.getBoundingClientRect()
      : { left: 0, top: 0 };
    this.boundingBox = boundingBox;
    this.sizeRatioX = this.width / this.boundingBox.width;
    this.sizeRatioY = this.height / this.boundingBox.height;*/
  }
}

const FRAMES_PER_SECOND = 50;
const INPUT_IDLE = 0;
const INPUT_ACTIVE = 1;
const INPUT_ENDED = 2;
const INPUT_DISTANCE_SENSITIVITY = 16;
const MAX_KEYS = 128;
//==============================================================================

/*  Actor Class
 */
//==============================================================================
class Actor {
  constructor() {
    this._x = 0;
    this._y = 0;
    this._z = 0;
    this.size = 1;
    
    this.geometry = null;
    this.material = null;
    this._mesh = null;
  }
  
  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }
  set x(val) { this._x = val; this._mesh && (this._mesh.position.x = val); }
  set y(val) { this._y = val; this._mesh && (this._mesh.position.y = val); }
  set z(val) { this._z = val; this._mesh && (this._mesh.position.z = val); }
  
  get mesh() { return this._mesh; }
  set mesh(val) {
    this._mesh = val;
    this._mesh.position.x = this._x;
    this._mesh.position.y = this._y;
    this._mesh.position.z = this._z;
  }
}
//==============================================================================

/*  Utility Classes
 */
//==============================================================================
const Utility = {
  randomInt: function (min, max) {
    let a = min < max ? min : max;
    let b = min < max ? max : min;
    return Math.floor(a + Math.random() * (b - a  + 1));
  },

  stopEvent: function (e) {
    //var eve = e || window.event;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
    e.returnValue = false;
    e.cancelBubble = true;
    return false;
  },
  
  getKeyCode(e) {
    //KeyboardEvent.keyCode is the most reliable identifier for a keyboard event
    //at the moment, but unfortunately it's being deprecated.
    if (e.keyCode) { 
      return e.keyCode;
    }
    
    //KeyboardEvent.code and KeyboardEvent.key are the 'new' standards, but it's
    //far from being standardised between browsers.
    if (e.code && KeyValues[e.code]) {
      return KeyValues[e.code]
    } else if (e.key && KeyValues[e.key]) {
      return KeyValues[e.key]
    }
    
    return 0;
  }
}

const KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,
  SPACE: 32,
  ESCAPE: 27
}

const KEY_VALUES = {
  "ArrowLeft": KEY_CODES.LEFT,
  "Left": KEY_CODES.LEFT,
  "ArrowUp": KEY_CODES.UP,
  "Up": KEY_CODES.UP,
  "ArrowDown": KEY_CODES.DOWN,
  "Down": KEY_CODES.DOWN,
  "ArrowRight": KEY_CODES.RIGHT,
  "Right": KEY_CODES.RIGHT,
  "Enter": KEY_CODES.ENTER,
  "Space": KEY_CODES.SPACE,
  " ": KEY_CODES.SPACE,
  "Esc": KEY_CODES.ESCAPE,
  "Escape": KEY_CODES.ESCAPE
}
//==============================================================================

/*  Initialisations
 */
//==============================================================================
var app;
window.onload = function() {
  window.app = new App();
};
//==============================================================================
