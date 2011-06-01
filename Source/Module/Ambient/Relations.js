/*
---
 
script: Relations.js
 
description: Define a widget associations
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Relation

provides: 
  - LSD.Module.Relations

...
*/

LSD.Module.Relations = new Class({
  initializers: {
    relations: function() {
      this.relations = {};
      this.related = {};
    }
  },
  
  addRelation: function(name, options) {
    if (!this.relations[name]) new LSD.Relation(name, this);
    return this.relations[name].setOptions(options);
  },
  
  removeRelation: function(name, options) {
    this.relations[name].setOptions(options, true);
    if (!this.relations[name].$options.length) delete this.relations[name];
  }
});

LSD.Options.relations = {
  add: 'addRelation',
  remove: 'removeRelation',
  iterate: true
};

LSD.Options.has = Object.append({
  process: function(has) {
    var one = has.one, many = has.many, relations = {};
    if (one) for (var name in one) relations[name] = one[name];
    if (many) for (var name in many) relations[name] = Object.append(many[name], {multiple: true});
    return relations;
  }
}, LSD.Options.relations);
