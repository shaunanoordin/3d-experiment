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
    //--------------------------------
    this.html = document.getElementById("app");
    this.canvas = this.html;  //In the original avo-adventure template, this was a separate <canvas> element.
    this.boundingBox = undefined;  //To be defined by this.updateSize().
    this.sizeRatioX = 1;
    this.sizeRatioY = 1;
    this.width = this.html.width;
    this.height = this.html.height;
    //--------------------------------
    
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
    if ("onmousedown" in this.canvas && "onmousemove" in this.canvas &&
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
    }
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
    this.camera.rotation.order = "YXZ";  //"YXZ" is good for FPS (gravity-locked) if x-rotation is locked to a min/max.
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById("app").appendChild(this.renderer.domElement);
    this.cameraControls = {
      phi: 0,  //Angle between z-axis to x-y plane.
      theta: 0,  //Angle between x-axis to y-axis.
    };
    //--------------------------------
    
    //Set up Scene
    //--------------------------------
    this.actors = [];
    this.addActor("PLANET", 0, 0, -5, 1);
    this.addActor("STAR", 0, 2, -4, 0.5);
    this.addActor("PLANET-R", 0, 0, 5, 1);
    this.addActor("PLANET-G", 10, 0, 0, 1);
    this.addActor("PLANET-B", -10, 0, 0, 1);
    this.addActor("STAR", 0, -5, 0, 0.2);
    this.addActor("PLANET-R", 2, -2, -4, 0.5);
    this.addActor("PLANET-R", -2, -2, -4, 0.5);
    //--------------------------------

    //Start!
    //--------------------------------
    this.runCycle = setInterval(this.run, 1000 / FRAMES_PER_SECOND);
    //--------------------------------
  }
  
  //----------------------------------------------------------------
  
  run() {
    //Get User Input: Keyboard Movement
    //--------------------------------
    let CAMERA_SPEED = 0.2;
    let CAMERA_ROTATION_SPEED = 0.01 * Math.PI;
    
    if ((this.keys[KEY_CODES.UP].state || this.keys[KEY_CODES.W].state) === INPUT_ACTIVE &&
        (this.keys[KEY_CODES.DOWN].state && this.keys[KEY_CODES.S].state) !== INPUT_ACTIVE) {
      this.camera.rotation.x += CAMERA_ROTATION_SPEED;
    } else if ((this.keys[KEY_CODES.UP].state && this.keys[KEY_CODES.W].state) !== INPUT_ACTIVE &&
               (this.keys[KEY_CODES.DOWN].state || this.keys[KEY_CODES.S].state) === INPUT_ACTIVE) {
      this.camera.rotation.x -= CAMERA_ROTATION_SPEED;
    }
    if ((this.keys[KEY_CODES.LEFT].state || this.keys[KEY_CODES.A].state) === INPUT_ACTIVE &&
        (this.keys[KEY_CODES.RIGHT].state && this.keys[KEY_CODES.D].state) !== INPUT_ACTIVE) {
      this.camera.rotation.y += CAMERA_ROTATION_SPEED;
    } else if ((this.keys[KEY_CODES.LEFT].state && this.keys[KEY_CODES.A].state) !== INPUT_ACTIVE &&
               (this.keys[KEY_CODES.RIGHT].state || this.keys[KEY_CODES.D].state) === INPUT_ACTIVE) {
      this.camera.rotation.y -= CAMERA_ROTATION_SPEED;
    }
    
    if (this.keys[KEY_CODES.SPACE].state === INPUT_ACTIVE) {
      let phi = this.camera.rotation.y;
      let theta = this.camera.rotation.x;
      this.camera.position.x += CAMERA_SPEED * Math.cos(theta) * -Math.sin(phi);
      this.camera.position.z += CAMERA_SPEED * Math.cos(theta) * -Math.cos(phi);
      this.camera.position.y += CAMERA_SPEED * Math.sin(theta);
    }
    //--------------------------------
    
    //Get User Input: Click on targets
    //--------------------------------
    if (this.pointer.state === INPUT_ENDED) {
      const target = new THREE.Vector2(  //This is -1.0 to +1.0 relative to the middle of the screen.
        (this.pointer.now.x / this.boundingBox.right) * 2 - 1,
        (this.pointer.now.y / this.boundingBox.bottom) * -2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(target, this.camera);
      
      //Highlight clicked items in white.
      let intersects = raycaster.intersectObjects(this.scene.children);
      for (let i = 0; i < intersects.length; i++) {
        intersects[i].object.material.color.set(0xffffff);
      }
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
        newActor.material = new THREE.MeshLambertMaterial({color: 0xcc9933});
        newActor.mesh = new THREE.Mesh( newActor.geometry, newActor.material );
        break;
      case "PLANET-R":
        newActor.geometry = new THREE.SphereGeometry(newActor.size / 2, 32, 32);
        newActor.material = new THREE.MeshLambertMaterial({color: 0xcc3333});
        newActor.mesh = new THREE.Mesh( newActor.geometry, newActor.material );
        break;
      case "PLANET-G":
        newActor.geometry = new THREE.SphereGeometry(newActor.size / 2, 32, 32);
        newActor.material = new THREE.MeshLambertMaterial({color: 0x33cc99});
        newActor.mesh = new THREE.Mesh( newActor.geometry, newActor.material );
        break;
      case "PLANET-B":
        newActor.geometry = new THREE.SphereGeometry(newActor.size / 2, 32, 32);
        newActor.material = new THREE.MeshLambertMaterial({color: 0x3399cc});
        newActor.mesh = new THREE.Mesh( newActor.geometry, newActor.material );
        break;
      case "STAR":
        newActor.geometry = new THREE.SphereGeometry(newActor.size / 2, 32, 32);
        newActor.material = new THREE.MeshBasicMaterial({color: 0xffee33});
        newActor.mesh = new THREE.Mesh(newActor.geometry, newActor.material);
        newActor.light = new THREE.PointLight(0xcccccc, 1, 50);
        break;
      default:
        break;
    }
    
    this.actors.push(newActor);
    newActor.mesh && this.scene.add(newActor.mesh);
    newActor.light && this.scene.add(newActor.light);
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
    let boundingBox = (this.canvas.getBoundingClientRect)
      ? this.canvas.getBoundingClientRect()
      : { left: 0, top: 0 };
    this.boundingBox = boundingBox;
    //this.sizeRatioX = this.width / this.boundingBox.width;
    //this.sizeRatioY = this.height / this.boundingBox.height;
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
    this._light = null;
  }
  
  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }
  set x(val) {
    this._x = val;
    this._mesh && (this._mesh.position.x = val);
    this._light && (this._light.position.x = val);
  }
  set y(val) {
    this._y = val;
    this._mesh && (this._mesh.position.y = val);
    this._light && (this._light.position.y = val);
  }
  set z(val) {
    this._z = val;
    this._mesh && (this._mesh.position.z = val);
    this._light && (this._light.position.z = val);
  }
  
  get mesh() { return this._mesh; }
  set mesh(val) {
    this._mesh = val;
    this._mesh.position.x = this._x;
    this._mesh.position.y = this._y;
    this._mesh.position.z = this._z;
  }
  
  get light() { return this._light; }
  set light(val) {
    this._light = val;
    this._light.position.x = this._x;
    this._light.position.y = this._y;
    this._light.position.z = this._z;
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
  ESCAPE: 27,
  TAB: 9,
  SHIFT: 16,
  
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,

  NUM0: 48,  
  NUM1: 49,
  NUM2: 50,
  NUM3: 51,
  NUM4: 52,
  NUM5: 53,
  NUM6: 54,
  NUM7: 55,
  NUM8: 56,
  NUM9: 57,
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
  "Escape": KEY_CODES.ESCAPE,
  "Tab": KEY_CODES.TAB,
  "Shift": KEY_CODES.SHIFT,
  "ShiftLeft": KEY_CODES.SHIFT,
  "ShiftRight": KEY_CODES.SHIFT,
  
  "A": KEY_CODES.A,
  "KeyA": KEY_CODES.A,
  "B": KEY_CODES.B,
  "KeyB": KEY_CODES.B,
  "C": KEY_CODES.C,
  "KeyC": KEY_CODES.C,
  "D": KEY_CODES.D,
  "KeyD": KEY_CODES.D,
  "E": KEY_CODES.E,
  "KeyE": KEY_CODES.E,
  "F": KEY_CODES.F,
  "KeyF": KEY_CODES.F,
  "G": KEY_CODES.G,
  "KeyG": KEY_CODES.G,
  "H": KEY_CODES.H,
  "KeyH": KEY_CODES.H,
  "I": KEY_CODES.I,
  "KeyI": KEY_CODES.I,
  "J": KEY_CODES.J,
  "KeyJ": KEY_CODES.J,
  "K": KEY_CODES.K,
  "KeyK": KEY_CODES.K,
  "L": KEY_CODES.L,
  "KeyL": KEY_CODES.L,
  "M": KEY_CODES.M,
  "KeyM": KEY_CODES.M,
  "N": KEY_CODES.N,
  "KeyN": KEY_CODES.N,
  "O": KEY_CODES.O,
  "KeyO": KEY_CODES.O,
  "P": KEY_CODES.P,
  "KeyP": KEY_CODES.P,
  "Q": KEY_CODES.Q,
  "KeyQ": KEY_CODES.Q,
  "R": KEY_CODES.R,
  "KeyR": KEY_CODES.R,
  "S": KEY_CODES.S,
  "KeyS": KEY_CODES.S,
  "T": KEY_CODES.T,
  "KeyT": KEY_CODES.T,
  "U": KEY_CODES.U,
  "KeyU": KEY_CODES.U,
  "V": KEY_CODES.V,
  "KeyV": KEY_CODES.V,
  "W": KEY_CODES.W,
  "KeyW": KEY_CODES.W,
  "X": KEY_CODES.X,
  "KeyX": KEY_CODES.X,
  "Y": KEY_CODES.Y,
  "KeyY": KEY_CODES.Y,
  "Z": KEY_CODES.Z,
  "KeyZ": KEY_CODES.Z,
  
  "0": KEY_CODES.NUM0,
  "Digit0": KEY_CODES.NUM0,
  "1": KEY_CODES.NUM1,
  "Digit1": KEY_CODES.NUM1,
  "2": KEY_CODES.NUM2,
  "Digit2": KEY_CODES.NUM2,
  "3": KEY_CODES.NUM3,
  "Digit3": KEY_CODES.NUM3,
  "4": KEY_CODES.NUM4,
  "Digit4": KEY_CODES.NUM4,
  "5": KEY_CODES.NUM5,
  "Digit5": KEY_CODES.NUM5,
  "6": KEY_CODES.NUM6,
  "Digit6": KEY_CODES.NUM6,
  "7": KEY_CODES.NUM7,
  "Digit7": KEY_CODES.NUM7,
  "8": KEY_CODES.NUM8,
  "Digit8": KEY_CODES.NUM8,
  "9": KEY_CODES.NUM9,
  "Digit9": KEY_CODES.NUM9,
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
