/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Module.Accessories
  - LSD.Module.Ambient
  - LSD.Module.Graphics
  - LSD.Mixin.Value

provides: 
  - LSD.Widget
 
...
*/

LSD.Widget = new Class({
  
  Implements: [
    LSD.Module.Accessories,
    LSD.Module.Ambient,
    LSD.Module.Graphics
  ],
  
  options: {
    /*
      The key in element storage that widget will use to store itself.
      When set to false, widget is not written into element storage.
    */
    key: 'widget',
    /*
      When set to true, layers option will enforce the default layer set.
    */
    layers: true
  },
  
  initialize: LSD.Module.Options.initialize
});

LSD.Module.Events.addEvents.call(LSD.Widget.prototype, {
  initialize: function() {
    this.addPseudo(this.pseudos.submittable ? 'read-write' : 'read-only');
  }
});

LSD.Widget.prototype.addStates('disabled', 'hidden', 'built', 'attached');

LSD.Behavior.attach(LSD.Widget);

new LSD.Type('Widget');

LSD.Element.pool.push(LSD.Widget);