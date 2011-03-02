/*
---
 
script: Commands.js
 
description: Document catches the clicks and creates pseudo-widgets on demand
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document
  - LSD.Node.Link
 
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
  
  onClick: function(event) {
    var link = (event.target.tagName.toLowerCase() == 'a') ? event.target : Slick.find(event.target, '! a');
    if (!link) return;
    var node = link.retrieve('node');
    if (!node) link.store('node', node = new LSD.Node.Link(link));
    node.click();
    event.preventDefault();
  }
});

