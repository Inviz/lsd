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
    var kicked = this.parent.apply(this, arguments);
    if (event/* && !(this.element.get('tag') == 'a' && this.getRequestMethod() == 'get' && !this.isRequestURLLocal() && kicked.indexOf('send') > -1)*/) event.preventDefault();
    return kicked;
  }
});