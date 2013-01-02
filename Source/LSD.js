/*
---
 
script: LSD.js
 
description: LSD namespace definition
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

provides: 
  - LSD
  - LSD.Properties
 
...
*/


var LSD = function() {
  
};
LSD.Slick = this.Slick;
LSD.Properties = {};
LSD.UIDs = {};
LSD.UID = 0;
LSD.negated = {};
LSD.negate = function(name) {
  if (name.substring(0, 3) == 'add') return 'remove' + name.substring(3);
  return 'un' + name;
};