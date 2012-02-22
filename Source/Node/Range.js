LSD.Range = new LSD.Struct.Array({
  endContainer: function() {
    
  },
  endOffset: function() {
    
  },
  startContainer: function() {
    
  },
  startOffset: function() {
    
  },
  selection: function() {
    
  }
  // commonAncestorContainer
  // collapsed
});
// Sets the start position of a Range
LSD.Range.prototype.setStart = function(startContainer, startOffset) {
  this.reset('startContainer', startContainer);
  this.reset('startOffset', startOffset || 0);
};
// Sets the end position of a Range
LSD.Range.prototype.setEnd = function(endContainer, endOffset) {
  this.reset('endContainer', endContainer);
  this.reset('endOffset', endOffset || 0);
};
// Sets the start position of a Range relative to another Node
LSD.Range.prototype.setStartBefore = function(node) {
  for (var i = 0, sibling = node; sibling = sibling.previousSibling; i++);
  this.setStart(node.parentNode, i);
};
// Sets the start position of a Range relative to another Node
LSD.Range.prototype.setStartAfter = function(node) {
  for (var i = 0, sibling = node; sibling = sibling.previousSibling; i++);
  this.setStart(node.parentNode, i + 1);
};
// Sets the end position of a Range relative to another Node
LSD.Range.prototype.setEndBefore = function(node) {
  for (var i = 0, sibling = node; sibling = sibling.previousSibling; i++);
  this.setEnd(node.parentNode, i);
};
// Sets the end position of a Range relative to another Node
LSD.Range.prototype.setEndAfter = function(node) {
  for (var i = 0, sibling = node; sibling = sibling.previousSibling; i++);
  this.setEnd(node.parentNode, i + 1);
};
// Sets the Range to contain the Node  and its contents
LSD.Range.prototype.selectNode = function() {
  for (var i = 0, sibling = node; sibling = sibling.previousSibling; i++);
  this.setStart(node.parentNode, i);
  this.setEnd(node.parentNode, i + 1);
};
// Sets the Range to contain the contents of a Node
LSD.Range.prototype.selectNodeContents = function(node) {
  this.setStart(node);
  this.setEnd(node, node.childNodes.length);
};
// Collapses the Range to one of its boundary points
LSD.Range.prototype.collapse = function(toStart) {
  return (toStart === true) ? this.collapseToStart() : this.collapseToEnd()
};
// Collapses the Range to the end boundary points
LSD.Range.prototype.collapseToStart = function() {
  return this.setEnd(this.startContainer, this.startOffset);
};
// Collapses the Range to the start boundary point
LSD.Range.prototype.collapseToEnd = function() {
  return this.setStart(this.endContainer, this.endOffset);
};
// Returns a DocumentFragment  copying the nodes of a Range
LSD.Range.prototype.cloneContents = function() {
  
};
// Removes the contents of a Range from the Document
LSD.Range.prototype.deleteContents = function() {
  
};
// Moves contents of a Range from the document tree into a DocumentFragment
LSD.Range.prototype.extractContents = function() {
  
};
// Moves content of a Range into a new node, placing the new node at the start of the specified range
LSD.Range.prototype.surroundContents = function() {
  
};
// Insert a Node  at the start of a Range
LSD.Range.prototype.insertNode = function() {
  
};
// Returns a Range object with boundary points identical to the cloned Range
LSD.Range.prototype.cloneRange = function() {
  
};
// Returns the text of the Range
LSD.Range.prototype.toString = function() {
  
};
// Convert LSD.Range into DOM range
LSD.Range.prototype.toRange = function() {
  
};
// Convert LSD.Range into DOM selection
LSD.Range.prototype.toSelection = function() {
  
};
// Selects the range
LSD.Range.prototype.select = function() {
  this.set('selection', this.toSelection());
};
// Unselects the range
LSD.Range.prototype.unselect = function() {
  this.unset('selection', this.selection);;
};
