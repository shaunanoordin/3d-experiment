"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*  
Starter JS
==========

Starter tempalte for JS projects

(Shaun A. Noordin || shaunanoordin.com || 20160509)
********************************************************************************
 */

/*  Primary App Class
 */
//==============================================================================

var App = function App() {
  _classCallCheck(this, App);

  this.console = document.getElementById("console");
  this.console.innerHTML = "This is a starter template for JS projects.";
};
//==============================================================================

/*  Initialisations
 */
//==============================================================================


var app;
window.onload = function () {
  window.app = new App();
};
//==============================================================================