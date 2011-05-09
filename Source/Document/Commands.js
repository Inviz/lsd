/*
---
 
script: Commands.js
 
description: Document catches the clicks and creates pseudo-widgets on demand
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document
  - Widgets/LSD.Native.Anchor
 
provides:
  - LSD.Document.Commands
 
...
*/

LSD.Document.Commands = new Class({
  options: {
    events: {
      element: {
        'click': 'onClick'
      }
    }
  },
  
  /* 
    Single relay click listener is put upon document.
    It spies for all clicks on elements and finds out if 
    any links were clicked. If the link is not widget,
    the listener creates a lightweight link class instance and
    calls click on it to trigger commands and interactions.
    
    This way there's no need to preinitialize all link handlers, 
    and only instantiate class when the link was actually clicked.
  */
  onClick: function(event) {
    var link = (LSD.toLowerCase(event.target.tagName) == 'a') ? event.target : Slick.find(event.target, '! a');
    if (!link) return;
    if (link.retrieve('widget')) return;
    var node = link.retrieve('node')
    if (!node) link.store('node', node = new LSD.Native.Anchor(link));
    node.click(event);
  }
});

