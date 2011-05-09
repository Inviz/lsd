/*
---
 
script: Set.js
 
description: Changes or synchronizes values
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action

provides:
  - LSD.Action.Set
 
...
*/

LSD.Action.Set = LSD.Action.build({
  enable: function(target, value) {
    switch (Element.get(target, 'tag')) {
      case 'input': case 'textarea':
        if (target.applyValue) target.applyValue(value);
        else target.value = value; break;
      default: 
        if (!target.lsd) target.set('html', value); break;
    }
  }
});