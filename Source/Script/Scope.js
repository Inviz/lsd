/*
---
 
script: Script/Scope.js
 
description: An function to define a variable scope that can inherit variables from parent scopes
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - LSD.Object
  
provides:
  - LSD.Script.Scope
  
...
*/

LSD.Script.Scope = function(object, scope) {
  if (this !== LSD.Script) object = this; 
  object.variables = (new LSD.Object.Stack);
  if (scope) LSD.Script.Scope.setScope(object, scope);
};

Object.append(LSD.Script.Scope, {
  setScope: function(object, scope) {
    object.variables.merge(scope.variables, true);
  },
  
  unsetScope: function(object, scope) {
    object.variables.unmerge(scope.variables, true);
  }
});