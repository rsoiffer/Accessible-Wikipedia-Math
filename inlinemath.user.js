// ==UserScript==
// @name          Inline accessible wikipedia math
// @namespace     http://www.talkingcatsoftware.com/gmscripts
// @description   Makes math authored with the "math" template accessible by adding a MathML equivalent to the template output
// @include       https://*.wikipedia.org/*
// @include       C:\Users\*\Wikipedia-replacement-test.html
// @require       http://code.jquery.com/jquery-3.1.1.min.js
// @version       0.1.0
// @ icon         http://www.example.net/icon.png
// ==/UserScript==

NodeList.prototype.toArray = function () {
  return Array.prototype.slice.call(this);
}

///// [Data Structures]

function Node(_type, _value, _children) {
  this.type = _type || "";
  this.value = _value || "";
  this.children = _children || [];
}

Node.prototype.stringify = function(level) {
  level = level || 0;
  return "  ".repeat(level) + this.type + ":" + this.value + "\n" + this.children.map(function (child) {
    return child.stringify(level+1);
  }).reduce(function (string, sum) {
    return string + sum;
  }, "");
};

///// [End Data Structures]

///// [Templates]

function GetTreeFromElement(element) {
  if (CheckSqrtTemplate(element)) return GetTreeFromSqrtElement(element);
  if (CheckRadicTemplate(element)) return GetTreeFromRadicElement(element);
  if (CheckSubTemplate(element)) return GetTreeFromSubTemplate(element);
  if (CheckSupTemplate(element)) return GetTreeFromSupTemplate(element);

  if (element.childNodes.length > 0) {
    if (element.childNodes.length === 1) {
      return GetTreeFromElement(element.childNodes[0]);
    } else {
      return new Node("row", "", element.childNodes.toArray().map(GetTreeFromElement));
    }
  }

  // Parse text
  var re = /([0-9]+|(?:[A-Z]|[a-z])+|[^\s])\s*/g;
  var tokens = [];
  var m;
  while (m = re.exec(element.textContent)) {
    tokens.push(m[1]);
  }

  if (tokens.length === 1) {
    return new Node("text", tokens[0]);
  } else {
    return new Node("row", "", tokens.map(function (token) {
      return new Node("text", token);
    }));
  }
}

function CheckSqrtTemplate(element) {
  return element.nodeName === "SPAN"
      && element.className === "nowrap"
      && element.childNodes.length === 2
      && element.childNodes[0].nodeName === "#text"
      && element.childNodes[0].data === "√";
}

function CheckRadicTemplate(element) {
  return element.nodeName === "SPAN"
      && element.className === "nowrap"
      && element.childNodes.length === 3
      && element.childNodes[1].nodeName === "#text"
      && element.childNodes[1].data === "√";
}

function CheckSubTemplate(element) {
  return element.nodeName === "SUB";
}

function CheckSupTemplate(element) {
  return element.nodeName === "SUP";
}

function GetTreeFromSqrtElement(element) {
  return new Node("sqrt", "", [GetTreeFromElement(element.childNodes[1])]);
}

function GetTreeFromRadicElement(element) {
  return new Node("radic", "", [GetTreeFromElement(element.childNodes[0].childNodes[0]),
                                GetTreeFromElement(element.childNodes[2])]);
}

function GetTreeFromSubTemplate(element) {
  return new Node("sub", "", element.childNodes.toArray().map(GetTreeFromElement));
}

function GetTreeFromSupTemplate(element) {
  return new Node("sup", "", element.childNodes.toArray().map(GetTreeFromElement));
}

///// [End Templates]

///// [Post Processing]

function TreePostProcessing(tree) {
  RemoveNestedRows(tree);
  MatchFences(tree);
}

function RemoveNestedRows(tree) {
  if (tree.type === "row") {
    while (tree.children.some(function (child) {
      return child.type === "row";
    })) {
      tree.children = [].concat.apply([], tree.children.map(function (child) {
        if (child.type === "row") {
          return child.children;
        } else {
          return [child];
        }
      }));
    }
  }

  tree.children.forEach(TreePostProcessing);
}

function MatchFences(tree) {
  function MatchOpenFences(children, closeFence) {
    var currentChildren = [];
    for (var i=0; i<children.length; ++i) {
      var child = children[i];
      // todo: generalize to all '()', '[]', '{}', etc
      if (child.type === "text" && child.value === "(") {
        return currentChildren.concat([new Node("fence", "parentheses", MatchOpenFences(children.slice(i+1), ")"))]);
      } else if (child.type === "text" && child.value === closeFence) {
        return currentChildren;
      } else {
        currentChildren.push(child);
      }
    }
    return currentChildren;
  }

  tree.children = MatchOpenFences(tree.children, "");
}

///// [End Post Processing]

function GetMathMLFromElement(element) {
  // Converts the span and its children into a MathML string
  // Returns a string representing the MathML or an empty string
  //   if it can’t do the conversion
  var tree = GetTreeFromElement(element);
  TreePostProcessing(tree);
  console.log(tree.stringify() + "\n\n\n\n");
}

function CreateInvisibleMathMLNode(mathmlText) {
  // Creates a span node with attrs
  //   class="mwe-math-mathml-inline mwe-math-mathml-a11y"
  //   style="display: none;"}
  // The child of the span is mathml string converted to XML
  // Returns a span element
  var spanElement = document.createElement("SPAN");
  //spanElement.setAttribute("class", "mwe-math-mathml-inline mwe-math-mathml-a11y");
  //spanElement.setAttribute("style", "display: none;");
  spanElement.innerHTML = mathmlText;
  return spanElement;
};

function Main() {
  console.log("Running Main()");
  var texhtmlElements = document.getElementsByClassName("texhtml");
  console.log("Found " + texhtmlElements.length + " texhtml elements to change")
  var i;
  for (i=0; i<texhtmlElements.length; i++) {
  	var element = texhtmlElements[i];
    var mathmlText = GetMathMLFromElement(element);
    if (mathmlText) {
      element.setAttribute("aria-hidden", "true");
  	  var mathmlSpan = CreateInvisibleMathMLNode(mathmlText);
  	  element.parentElement.insertBefore(mathmlSpan, element);
    }
    console.log("All done");
  }
}

try {
  Main();
} catch (e) {
  console.error(e);
}
