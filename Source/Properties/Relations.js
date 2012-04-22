/*
---
 
script: Relations.js
 
description: An dynamic collection or link with specific configuration
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Group
  - LSD.Struct
  - LSD.NodeList

provides: 
  - LSD.Properties.Relations
 
...
*/

LSD.Relation = new LSD.Struct({
  match: '_owner.matches.set matcher',
  proxy: '_owner.proxies.set proxier'
}, 'NodeList');

LSD.Relation.prototype._matcher = function(callback, value, old) {
  if (value != null) this.push(value);
  if (old != null) {
    var index = this.indexOf(old);
    if (index > -1) this.splice(index, 1);
  }
};

