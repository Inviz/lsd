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
    var widget = LSD.Module.DOM.find(target, true);
    switch (LSD.toLowerCase(target.tagName)) {
      case 'input': case 'textarea':
        if (target.applyValue) target.applyValue(value);
        else target.value = value; break;
      default:
        if (widget && widget.findItemByValue) {
          var item = widget.findItemByValue(value);
          if (item) item.click();
        } else if (!target.lsd) target.set('html', value);
        break;
    }
  }
});