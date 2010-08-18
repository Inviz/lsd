ART.Widget.Textarea = new Class({
  Extends: ART.Widget.Input,
  
  name: 'textarea',
  
  getInput: function() {
    if (!this.input) this.input = new Element('textarea');
    return this.input;
  }
})