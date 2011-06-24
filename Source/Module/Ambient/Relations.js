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
    /*
      A deleted scope can remove its parent relation before relation gets to the 
      deletion of itself. No need to clean then, it's already clean 
    */
    if (this.relations[name] && !this.relations[name].$options.length) delete this.relations[name];
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

LSD.Relation.Traits = {
  selectable: {
    scopes: {
      selected: {
        filter: ':selected',
        callbacks: {
          add: function(widget) {
            if (this.setValue) this.setValue(widget);
            this.fireEvent('set', widget);
          },
          remove: function(widget) {
            if (widget.getCommandType() != 'checkbox') return;
            if (this.setValue) this.setValue(widget, true);
            this.fireEvent('unset', widget);
          }
        }
      }
    }
  },
  
  contextmenu: {
    as: 'initiator',
    tag: 'menu',
    attributes: {
      type: 'context'
    },
    proxy: function(widget) {
      return widget.pseudos.item;
    },
    states: {
      use: Array.fast('collapsed'),
      set: {
        collapsed: 'hidden'
      },
      get: {
        hidden: 'collapsed'
      }
    }
  },
  
  dialog: {
    as: 'initiator',
    holder: 'document',
    tag: 'body',
    attributes: {
      type: 'dialog'
    }
  }
};
