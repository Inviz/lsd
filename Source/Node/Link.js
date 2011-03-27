/*
---
 
script: Link.js
 
description: A link that does requests and actions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Module.Attributes
  - LSD.Module.Events
  - LSD.Module.Layout
  - LSD.Module.Target
  - LSD.Module.Command
  - LSD.Module.Actions
  - LSD.Mixin.Request
  - LSD.Mixin.Dialog

provides: 
  - LSD.Node.Link
 
...
*/

LSD.Node.Link = new Class({
  Includes: [
    LSD.Node,
    LSD.Module.Attributes,
    LSD.Module.Events,
    LSD.Module.Layout,
    LSD.Module.Command,
    LSD.Module.Actions,
    LSD.Module.Target,
    LSD.Mixin.Request,
    LSD.Mixin.Dialog
  ],
  
  options: {
    request: {
      type: 'form'
    },
    layout: {
      instance: false,
      extract: true
    }
  },

  click: function(event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!this.disabled) return this.parent.apply(this, arguments);
  }
});