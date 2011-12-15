LSD.Attributes = {
  tabindex: Number,
  width:    'number',
  height:   'number',
  readonly: 'boolean',
  disabled: 'boolean',
  hidden:   'boolean',
  checked:  'boolean',
  multiple:  'boolean',
  id: function(id) {
    this.id = id;
  },
  'class': function(value) {
    value.split(' ').each(this.addClass.bind(this));
  },
  style: function(value) {
    value.split(/\s*;\s*/).each(function(definition) {
      var bits = definition.split(/\s*:\s*/)
      if (!bits[1]) return;
      bits[0] = bits[0].camelCase();
      var integer = bits[1].toInt();
      if (bits[1].indexOf('px') > -1 || (integer == bits[1])) bits[1] = integer
      //this.setStyle.apply(this, bits);
    }, this);
  }
}