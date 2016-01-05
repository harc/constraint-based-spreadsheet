function toDOM(x) {
  if (x instanceof Node) {
    return x;
  } else if (x instanceof Array) {
    var xNode = document.createElement(x[0]);
    x.slice(1).
      map(function(y) { return toDOM(y); }).
      forEach(function(yNode) { xNode.appendChild(yNode); });
    if (typeof x.attributes === 'object') {
      Object.keys(x.attributes).forEach(function(attributeName) {
        xNode.setAttribute(attributeName, x.attributes[attributeName]);
      });
    }
    return xNode;
  } else {
    return document.createTextNode(x);
  }
}

function withAttributes(arr, attrDict) {
  arr.attributes = attrDict;
  return arr;
}

