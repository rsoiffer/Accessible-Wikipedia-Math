// ==UserScript==
// @name          Inline accessible wikipedia math
// @namespace     http://www.talkingcatsoftware.com/gmscripts
// @description   Makes math authored with the "math" template accessible by adding a MathML equivalent to the template output
// @include       https://*.wikipedia.org/*
// @require       https://raw.githubusercontent.com/slevithan/xregexp/master/xregexp-all.js
// @version       0.1.0
// @icon         http://www.example.net/icon.png
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

Node.prototype.stringify = function (level) {
    level = level || 0;
    return "  ".repeat(level) + this.type + ":" + this.value + "\n" + this.children.map(function (child) {
        return child.stringify(level + 1);
    }).reduce(function (string, sum) {
        return string + sum;
    }, "");
};

///// [End Data Structures]

///// [Templates]

function GetTreeFromElement(element) {
    if (CheckSqrtTemplate(element))
        return GetTreeFromSqrtElement(element);
    if (CheckRadicTemplate(element))
        return GetTreeFromRadicElement(element);
    if (CheckSubTemplate(element))
        return GetTreeFromSubTemplate(element);
    if (CheckSupTemplate(element))
        return GetTreeFromSupTemplate(element);

    if (element.childNodes.length > 0) {
        return CreateRowNode(element);
    }

    // Parse text
    var re = XRegExp("\\s*([0-9]+|\\pL+|[^\\s])\\s*");
    var tokens = [];
    var m;
    var pos = 0;
//    console.log(element.textContent);
    while (m = XRegExp.exec(element.textContent, re, pos, "sticky")) {
        tokens.push(m[1]);
        pos = m.index + m[0].length;
//        console.log(m);
    }
//    var re = /([0-9]+|(?:[A-Z]|[a-z])+|[^\s])\s*/g;
//    var tokens = [];
//    var m;
//    while (m = re.exec(element.textContent)) {
//        tokens.push(m[1]);
//    }

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
    return new Node("sub", "", [CreateRowNode(element)]);
}

function GetTreeFromSupTemplate(element) {
    return new Node("sup", "", [CreateRowNode(element)]);
}

function CreateRowNode(element) {
    if (element.childNodes.length === 1) {
        return GetTreeFromElement(element.childNodes[0]);
    } else {
        return new Node("row", "", element.childNodes.toArray().map(GetTreeFromElement));
    }
}

///// [End Templates]

///// [Post Processing]

function TreePostProcessing(node) {
    RemoveNestedRows(node);
    MatchFences(node);
    FixSubSup(node);
}

function RemoveNestedRows(node) {
    if (node.type === "row") {
        while (node.children.some(function (child) {
            return child.type === "row";
        })) {
            node.children = [].concat.apply([], node.children.map(function (child) {
                if (child.type === "row") {
                    return child.children;
                } else {
                    return [child];
                }
            }));
        }
    }
    node.children.forEach(RemoveNestedRows);
}

function MatchFences(node) {
    var openFences = ["(", "[", "{"];
    var closeFences = [")", "]", "}"];

    while (node.children.some(function (child) {
        return child.type === "text" && openFences.includes(child.value);
    })) {
        var lastFencePos = -1;
        var lastFenceType = "";
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.type === "text" && openFences.includes(child.value)) {
                lastFencePos = i;
                lastFenceType = child.value;
            } else if (child.type === "text" && closeFences.includes(child.value) && lastFencePos !== -1) {
                var newNode = new Node("fence", lastFenceType + child.value, node.children.splice(lastFencePos, i - lastFencePos + 1).slice(1, -1));
                node.children.splice(lastFencePos, 0, newNode);
                break;
            }
        }
    }
    node.children.forEach(MatchFences);
}

function FixSubSup(node) {
    for (var i = 1; i < node.children.length; i++) {
        var child = node.children[i];
        if (child.type === "sub" || child.type === "sup") {
            if (child.children.length === 1) {
                i--;
                child.children.unshift(node.children.splice(i, 1)[0]);
            }
        }
    }
    node.children.forEach(FixSubSup);
}

///// [End Post Processing]

function TreeToMathML(node) {
    var children = node.children.map(TreeToMathML).reduce(function (a, b) {
        return a + b;
    }, "");

    switch (node.type) {
        case "row":
            return "<mrow>" + children + "</mrow>";
        case "sqrt":
            return "<msqrt>" + children + "</msqrt>";
        case "radic":
            return "<mroot>" + children + "</mroot>";
        case "sub":
            return "<msub>" + children + "</msub>";
        case "sup":
            return "<msup>" + children + "</msup>";
        case "fence":
            if (node.children.length === 1) {
                return "<mrow><mo>" + node.value.charAt(0) + "</mo>" + children + "<mo>" + node.value.charAt(1) + "</mo></mrow>";
            } else {
                return "<mrow><mo>" + node.value.charAt(0) + "</mo><mrow>" + children + "</mrow><mo>" + node.value.charAt(1) + "</mo></mrow>";
            }
        case "text":
            if (true) {
                return "<mi>" + node.value + "</mi>";
            } else if (true) {
                return "<mo>" + node.value + "</mn>";
            } else {
                return "<mo>" + node.value + "</mo>";
            }
    }
}

function GetMathMLFromElement(element) {
    // Converts the span and its children into a MathML string
    // Returns a string representing the MathML or an empty string
    //   if it can’t do the conversion
    var node = GetTreeFromElement(element);
    TreePostProcessing(node);
    console.log(node.stringify() + "\n\n\n\n");
    return "<math>" + TreeToMathML(node) + "</math>";
}

function CreateInvisibleMathMLNode(mathmlText) {
    // Creates a span node with attrs
    //   class="mwe-math-mathml-inline mwe-math-mathml-a11y"
    //   style="display: none;"}
    // The child of the span is mathml string converted to XML
    // Returns a span element
    var spanElement = document.createElement("SPAN");
    spanElement.setAttribute("class", "mwe-math-mathml-inline mwe-math-mathml-a11y");
//    spanElement.setAttribute("class", "mwe-math-mathml-inline");
    //spanElement.setAttribute("style", "display: none;");
    spanElement.innerHTML = mathmlText;
    return spanElement;
}

function Main() {
    console.log("Running Main()");
    var texhtmlElements = document.getElementsByClassName("texhtml");
    console.log("Found " + texhtmlElements.length + " texhtml elements to change")
    var i;
    for (i = 0; i < texhtmlElements.length; i++) {
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
