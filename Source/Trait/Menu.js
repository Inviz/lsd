/*
---
 
script: Menu.js
 
description: Dropdowns should be easy to use.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Trait
  - Widgets/LSD.Widget.Menu.Context

provides:
  - LSD.Trait.Menu
 
...
*/

LSD.Relation.Menu = {
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
};

LSD.Relation.Dialog = {
  as: 'initiator',
  holder: 'document',
  tag: 'body',
  attributes: {
    type: 'dialog'
  }
};
