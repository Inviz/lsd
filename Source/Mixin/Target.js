/*
---
 
script: Target.js
 
description: A mixins that assigns command targets from selectors in markup
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
 
provides:
  - LSD.Mixin.Target
 
...
*/
  
LSD.Mixin.Target = new Class({
  behaviour: '[target][target!=_blank][target!=false]',
  
  getTarget: Macro.getter('target', function() {
    return 
  })
})