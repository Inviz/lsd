/*
---
 
script: Properties.js
 
description: A watchable proxy object that holds internal widget properties
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Script/LSD.Script.Scope
  - LSD.Script/LSD.Struct
  - LSD.Module.Options
  - LSD.Module.Events
  - LSD.Module.Attributes
  
  
provides:
  - LSD.Module.Properties

...
*/




LSD.Module.Properties = new Class({


});

LSD.Module.Events.addEvents.call(LSD.Module.Properties.prototype, {
  beforeBuild: function() {
    if (this.source == null) 
      this.properties.set('source', LSD.Module.Properties.getSource(this));
  },
  finalize: function() {
    if (this.source || this.attributes.type || this.attributes.kind) {
      var role = LSD.Module.Properties.getRole(this);
      if (this.role !== role) this.properties.set('role', role)
    }
  }
});

Object.append(LSD.Module.Properties, {

});

LSD.Module.Properties.Exported = {
  parent: 'parentNode',
  next: 'nextSibling',
  previous: 'previousSibling',
  first: 'firstChild',
  last: 'lastChild',
  tag: 'tagName'
};

LSD.Module.Properties.Aliased = {
  document: 'ownerDocument',
  tag: 'nodeName'
};