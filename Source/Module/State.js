/*
---

script: State.js

description: Things that change the widget in one module

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.Options
  - LSD.Module.States
  - LSD.Module.Attributes
  - LSD.Module.Events
  - LSD.Module.Dimensions
  - LSD.Module.Styles
  - LSD.Module.Shortcuts
  - LSD.Module.Element

provides: 
  - LSD.Module.State

...
*/

LSD.Module.State = new Class;

['Options', 'States', 'Attributes', 'Events', 'Dimensions', 'Styles', 'Shortcuts', 'Element'].each(function(name) {
  Object.merge(LSD.Module.State.prototype, LSD.Module[name].prototype);
});