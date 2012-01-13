/*
---
 
script: Namespace.js
 
description: A global object that holds references to base objects and configuration
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Object.Stack
  
provides:
  - LSD.Namespace
  - LSD.Type
  - LSD.roles
  - LSD.layers
  - LSD.states
  - LSD.styles
  - LSD.relations
  - LSD.attributes
  - LSD.properties
  - LSD.allocations
 
...
*/

LSD.Namespace = function(object) {
  return new LSD.Object.Stack(object);
}

/*
  The following is a basic set of structures that every
  LSD namespace implements. Those are global objects
  that customize the behavior of widgets by providing 
  reusable pieces of configuration and defining various
  possible collections.
  
  For example LSD.attributes contains functions that are
  called whenever a widget in that namespaces recieves
  by that name. 
  
  LSD.relations provides a set of preconfigured relations 
  that can be further customized for each of the widgets.  
*/
LSD.Namespace.Structures = {
  Type:        {},
  roles:       {},
  layers:      {},
  states:      {},
  styles:      {},
  relations:   {},
  attributes:  {},
  properties:  {},
  allocations: {}
};

Object.append(LSD, new LSD.Namespace).mix(LSD.Namespace.Structures)