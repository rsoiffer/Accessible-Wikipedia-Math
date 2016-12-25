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
    if (CheckFractionTemplate(element))
        return GetTreeFromFractionTemplate(element);
    if (CheckFractionTemplate2(element))
        return GetTreeFromFractionTemplate2(element);
    if (CheckIntegralTemplate(element))
        return GetTreeFromIntegralTemplate(element);
    if (CheckSubTemplate(element))
        return GetTreeFromSubTemplate(element);
    if (CheckSupTemplate(element))
        return GetTreeFromSupTemplate(element);
    if (CheckVariableTemplate(element))
        return GetTreeFromVariableTemplate(element);
    if (CheckDelimTemplate(element))
        return GetTreeFromDelimTemplate(element);

    if (element.childNodes.length > 0) {
        return CreateRowNode(element);
    }

    // Parse text
    var re = XRegExp("\\s*([0-9]+|\\pL+|[^\\s])\\s*");
    var tokens = [];
    var m;
    var pos = 0;
    while (m = XRegExp.exec(element.textContent, re, pos, "sticky")) {
        tokens.push(m[1]);
        pos = m.index + m[0].length;
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
            && element.childNodes[0].data === String.fromCharCode(8730); //8730 is √
}

function CheckRadicTemplate(element) {
    return element.nodeName === "SPAN"
            && element.className === "nowrap"
            && element.childNodes.length === 3
            && element.childNodes[1].nodeName === "#text"
            && element.childNodes[1].data === String.fromCharCode(8730); //8730 is √
}

function CheckFractionTemplate(element) {
    return element.nodeName === "SPAN"
            && element.className === "sfrac nowrap"
            && element.childNodes.length === 3;
}

function CheckFractionTemplate2(element) {
    return element.nodeName === "SPAN"
            && element.className === "frac nowrap"
            && element.childNodes.length === 3;
}

function CheckIntegralTemplate(element) {
    var integralSymbols = [String.fromCharCode(8747), //8747 is ∫
        String.fromCharCode(8748), //8748 is ∬
        String.fromCharCode(8749), //8749 is ∭
        String.fromCharCode(8750), //8750 is ∮
        String.fromCharCode(8751), //8751 is ∯
        String.fromCharCode(8752), //8752 is ∰
        String.fromCharCode(8754), //8754 is ∲
        String.fromCharCode(8755)]; //8755 is ∳
    return element.nodeName === "SPAN"
            && element.childNodes.length === 2
            && element.childNodes[0].childNodes.length === 1
            && integralSymbols.includes(element.childNodes[0].childNodes[0].data);
}

function CheckSubTemplate(element) {
    return element.nodeName === "SUB";
}

function CheckSupTemplate(element) {
    return element.nodeName === "SUP";
}

function CheckVariableTemplate(element) {
    return element.nodeName === "I"
            && element.childNodes.length === 1
            && element.childNodes[0].nodeName === "#text";
}

function CheckDelimTemplate(element) {
    return element.className === "sfrac nowrap;"
            && element.childNodes.length >= 4;
}

function GetTreeFromSqrtElement(element) {
    return new Node("sqrt", "", [GetTreeFromElement(element.childNodes[1])]);
}

function GetTreeFromRadicElement(element) {
    return new Node("radic", "", [GetTreeFromElement(element.childNodes[2]), GetTreeFromElement(element.childNodes[0].childNodes[0])]);
}

function GetTreeFromFractionTemplate(element) {
    return new Node("frac", "", [GetTreeFromElement(element.childNodes[0]),
        GetTreeFromElement(element.childNodes[2])]);
}

function GetTreeFromFractionTemplate2(element) {
    return new Node("frac", "", [GetTreeFromElement(element.childNodes[0].childNodes[0]),
        GetTreeFromElement(element.childNodes[2].childNodes[0])]);
}

function GetTreeFromIntegralTemplate(element) {
    var elementData = element.childNodes[1].childNodes.toArray();
    var brIndex = elementData.length;
    for (var i = 0; i < elementData.length; ++i) {
        if (elementData[i].nodeName === "BR") {
            brIndex = i;
            break;
        }
    }
    var upper = elementData.slice(0, brIndex);
    var lower = elementData.slice(brIndex + 1);
    var upperElement = new Node("row", "");
    if (upper.length > 1) {
        upperElement = new Node("row", "", upper.map(GetTreeFromElement));
    } else if (upper.length === 1) {
        upperElement = GetTreeFromElement(upper[0]);
    }

    var lowerElement = new Node("row", "");
    if (lower.length > 1) {
        lowerElement = new Node("row", "", lower.map(GetTreeFromElement));
    } else if (lower.length === 1) {
        lowerElement = GetTreeFromElement(lower[0]);
    }

    var children = [];
    if (lowerElement)
        children.push(lowerElement);
    if (upperElement)
        children.push(upperElement);

    return new Node("integral", element.childNodes[0].childNodes[0].data, children);
}

function GetTreeFromSubTemplate(element) {
    return new Node("sub", "", [CreateRowNode(element)]);
}

function GetTreeFromSupTemplate(element) {
    return new Node("sup", "", [CreateRowNode(element)]);
}

function GetTreeFromVariableTemplate(element) {
    if (element.childNodes[0].data.length === 1) {
        return new Node("text", element.childNodes[0].data);
    } else {
        return new Node("row", "", element.childNodes[0].data.split("").map(function (char) {
            return new Node("text", char);
        }));
    }
}

function GetTreeFromDelimTemplate(element) {
    var leftType = "(", rightType = ")";
    switch (element.childNodes[1].childNodes[0].childNodes[0].childNodes[0].data) {
        case String.fromCharCode(9121): // 9121 is ⎡ (left square bracket upper corner)
            leftType = "[";
            break;
        case String.fromCharCode(9474): // 9474 is │ (box drawings light vertical)
            leftType = "|";
            break;
        case String.fromCharCode(9553): // 9553 is ║ (box drawings double vertical)
            leftType = String.fromCharCode(8214); // 8214 is ‖ (double vertical line)
            break;
    }
    switch (element.childNodes[element.childNodes.length - 2].childNodes[0].childNodes[0].childNodes[0].data) {
        case String.fromCharCode(9124): // 9124 is (right square bracket upper corner)
            rightType = "]";
            break;
        case String.fromCharCode(9474): // 9474 is │ (box drawings light vertical)
            rightType = "|";
            break;
        case String.fromCharCode(9553): // 9553 is ║ (box drawings double vertical)
            rightType = String.fromCharCode(8214); // 8214 is ‖ (double vertical line)
            break;
    }
    var newNode = new Node("fence", leftType + rightType);
    for (var i = 2; i < element.childNodes.length - 2; i++) {
        newNode.children.push(GetTreeFromElement(element.childNodes[i]));
    }
    return newNode;
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
    if (node.type === "sub" || node.type === "sup") {
        if (node.children.length < 2) {
            node.type = "row";
        }
    } else {
        for (var i = 1; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.type === "sub" || child.type === "sup") {
                if (child.children.length === 1) {
                    i--;
                    child.children.unshift(node.children.splice(i, 1)[0]);
                }
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
        case "frac":
            return "<mfrac>" + children + "</mfrac>";
        case "integral":
            return "<msubsup><mo>" + node.value + "</mo>" + children + "</msubsup>"
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
            if (XRegExp.test(node.value, XRegExp("\\pL+"))) {
                return "<mi>" + node.value + "</mi>";
            } else if (/[0-9]+/.test(node.value)) {
                return "<mn>" + node.value + "</mn>";
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
    console.log(node.stringify());
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
    spanElement.setAttribute("style", "display: none;");
    spanElement.innerHTML = mathmlText;
    return spanElement;
}

function FindMathElements(element) {
    if (element.className && (element.className.includes("texhtml")
            || element.className.includes("sfrac")
            || (element.nodeName === "SPAN" && element.className === "nowrap" && !element.outerHTML.includes("mathml")))) {
        var mathmlText = GetMathMLFromElement(element);
        if (mathmlText) {
            element.setAttribute("aria-hidden", "true");
            var mathmlSpan = CreateInvisibleMathMLNode(mathmlText);
            element.parentElement.insertBefore(mathmlSpan, element);
        }
    } else {
        element.childNodes.toArray().forEach(FindMathElements);
    }
}

try {
    FindMathElements(document);
} catch (e) {
    console.error(e);
}
