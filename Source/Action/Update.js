/*
---
 
script: Update.js
 
description: Update widget with html or json
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action

provides:
  - LSD.Action.Update
  - LSD.Action.Append
  - LSD.Action.Replace
  - LSD.Action.Before
  - LSD.Action.After

...
*/

LSD.Action.Update = LSD.Action.build({
  enable: function(target, content) {
    if (!content) return LSD.warn('Update action did not recieve content');
    var widget = LSD.Module.DOM.find(target);
    var fragment = document.createFragment(content);
    var children = LSD.slice(fragment.childNodes);
    var element = target.lsd ? target.toElement() : target;
    var container = (target.lsd || (widget.element == target && widget)) ? widget.getWrapper() : element;
    var args = [container, (widget.element == element ? widget.parentNode : widget), 
                fragment, children, content];
    this.options.update.apply(this, args);
  },
  
  update: function(target, parent, fragment, children) {
    document.id(target).empty().appendChild(fragment);
    parent.fireEvent('DOMNodeInserted', [children]);
  }
});

LSD.Action.Append = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,
  
  update: function(target, parent, fragment, children) {
    target.appendChild(fragment);
    parent.fireEvent('DOMNodeInserted', [children]);
  }
});

LSD.Action.Replace = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(target, parent, fragment, children) {
    target.parentNode.replaceChild(fragment, target);
    parent.fireEvent('DOMNodeInserted', [children, target]);
  }
});

LSD.Action.Before = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(target, parent, fragment, children) {
    target.parentNode.insertBefore(fragment, target);
    parent.fireEvent('DOMNodeInsertedBefore', [children, target]);
  }
});

LSD.Action.After = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(target, widget, fragment, children) {
    target.parentNode.insertBefore(fragment, target.nextSibling);
    parent.fireEvent('DOMNodeInsertedBefore', [children, target.nextSibling]);
  }
});