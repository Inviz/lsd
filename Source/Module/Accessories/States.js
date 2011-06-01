/*
---
 
script: States.js
 
description: Define class states and methods metaprogrammatically
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Ext/States
  - LSD.Module
  
provides: 
  - LSD.Module.States

...
*/

LSD.Module.States = States;

LSD.Options.states = {
  add: 'addState',
  remove: 'removeState',
  iterate: true
};