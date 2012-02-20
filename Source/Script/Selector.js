/*
---
 
script: Script/Selector.js
 
description: An object that fetches Elements from DOM and returns a collection
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script.Variable
  
provides:
  - LSD.Script.Selector
  
...
*/

/*
  Selectors can be used without escaping them in strings in LSD.Script. 
  A selector targetted at widgets updates the collection as the widgets
  change and recalculates the expression in real time.
  
  The only tricky part is that a simple selector may be recognized as
  a variable (e.g. `div.container`) or logical expression (`ul > li`) and 
  not fetch the elements. A combinator added before ambigious expression 
  would help parser to recognize selector. Referential combinators 
  `$`, `&`, `&&`, and `$$` may be used for that. Selectors are targetted
  at widgets by default, unless `$$` or `$` combinator is used.
  
  You can learn more about selectors and combinators in LSD.Module.Selector
  
  Examples of expressions with selectors:
    
      // Following selectors will observe changes in DOM and update collection
      // Because they are targetted at widgets
      
      // Count `item` children in `menu#main` widget
      "count(menu#main > item)" 
      
      // Returns collection of widgets related to `grid` as `items` that are `:selected`
      "grid::items:selected" 
      
      // Return next widget to current widget
      "& + *" 
      
      // Combinators that have $ or $$ as referential combinators will not observe changes
      // and only fetch element once from Element DOM 
  
      // Find all `item` children in `menu` in current element
      "$ menu > item"
      
      // Find `section` in parents that has no `section` siblings, and a details element next to it
      "$ ! section:only-of-type() + details"
      
      // Following example is INCORRECT, because it is AMBIGIOUS and will not be recognized selector
      "ul > li" // variable `ul` greater than `li`
      
      // CORRECT way: Add a combinator to disambiguate
      "& ul > li"
      
*/


LSD.Script.Selector = function(input, scope, output) {
  LSD.UIDs[this.lsd = ++LSD.UID] = this;
  this.input = input.replace(LSD.Script.Selector.rElementContext, function(whole, match) {
    switch (match) {
      case "$": 
        this.element = this.scope.toElement();
        return '';
      case "$$":
        this.element = this.scope.toElement().ownerDocument.body;
        return '';
    }
  }.bind(this));
  this.output = output;
  this.scope = this.getContext();
  this.collection = new LSD.Array;
  if (!this.scope) throw "Selector should be applied on widgets";
};

LSD.Script.Selector.prototype = new LSD.Script.Variable;
LSD.Script.Selector.prototype.type = 'selector',
LSD.Script.Selector.prototype.request = function(input, callback, scope, state) {
  if (this.element) {
    LSD.Slick.search(this.element, input).each(callback);
  } else {
    this.scope[state ? 'watch' : 'unwatch'](input, callback);
  }
  if (typeof this.value == 'undefined') this.reset()
};
LSD.Script.Selector.prototype.set = function(node, state) {
  if (this.filter && !this.filter(node)) return;
  if (state) {
    this.collection.push(node);
  } else {
    var index = this.collection.indexOf(node);
    if (index > -1) this.collection.splice(index, 1);
  }
  this.reset();
};
LSD.Script.Selector.prototype.reset = function() {
  this.value = this.collection.length ? this.collection : false;
  this.onValueSet(this.value);
};
LSD.Script.Selector.rElementContext = /^\s*([$]+)\s*/;