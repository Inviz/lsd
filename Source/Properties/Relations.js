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
  - LSD.Relations
 
...
*/

LSD.Relation = new LSD.Struct({
  match: '_owner.matches.set manager',
  proxy: '_owner.proxies.set manager'
}, 'NodeList');
LSD.Relation.prototype._aggregate = true;
