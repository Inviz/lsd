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
  - LSD.Module.Command
  - LSD.Module.Actions
  - LSD.Mixin.Request
  - LSD.Mixin.Target

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
    LSD.Mixin.Request,
    LSD.Mixin.Target
  ],
  
  options: {
    layout: {
      instance: false,
      extract: true
    }
  },
  
  getCommandAction: function() {
    return this.parent.apply(this, arguments) || 'send'
  }
})