/*
---
 
script: Native.js
 
description: Wrapper for native browser controls
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Module.Events
  - LSD.Module.Expectations
  - LSD.Module.DOM
  - LSD.Module.Attributes
  - LSD.Module.Actions
  - LSD.Module.Command

provides: 
  - LSD.Native
 
...
*/

/*
  LSD.Widget autoloads all of the modules that are defined in Old.Module namespace
  unless LSD.modules array is provided.
  
  So if a new module needs to be included into the base class, then it only needs
  to be *require*d.
*/
LSD.Native = new Class({
  
  Includes: [
    LSD.Node,
    LSD.Module.Events,
    LSD.Module.Expectations,
    LSD.Module.Layout,
    LSD.Module.DOM,
    LSD.Module.Attributes,
    LSD.Module.Actions,
    LSD.Module.Command
  ],
  
  States: Object.subset(LSD.States.Known, ['built', 'attached']),
  
  options: {
    writable: false,
    events: {
      _native: {
        enable: function() {
          this.element.erase('disabled');
        },
        disable: function() {
          this.element.set('disabled', true);
        }
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    if (this.options.writable && !this.attributes.tabindex && (this.options.focusable !== false)) this.setAttribute('tabindex', 0) 
    this.addPseudo(this.options.writable ? 'read-write' : 'read-only');
    if (this.element) this.build()
  },
  
  setContent: function(content) {
    this.toElement().innerHTML = content;
  }
});