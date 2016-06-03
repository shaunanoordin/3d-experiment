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
class App {
  constructor() {
    this.console = document.getElementById("console");
    this.console.innerHTML = "This is a starter template for JS projects.";
  }
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
