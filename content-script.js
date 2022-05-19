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

// Actually, this could be a text node also -- code checks
function GetTreeFromElement(element) {
    if (element.nodeName === "SPAN" && element.getAttribute("style") === "display:none") {
        return new Node("row", "");
    }
    if (element.nodeType === 1 ) {  // ELEMENT_NODEfor ba
        // these check the className, and hence need to be elements
        if (CheckSqrtTemplate(element))
        return GetTreeFromSqrtElement(element);
        if (CheckRadicTemplate(element))
            return GetTreeFromRadicElement(element);
        if (CheckFractionTemplate(element))
            return GetTreeFromFractionTemplate(element);
        if (CheckFractionTemplate2(element))
            return GetTreeFromFractionTemplate2(element);
        if (CheckDelimTemplate(element))
            return GetTreeFromDelimTemplate(element);

        // all of these assume we have an element (SPAN, SUB, SUP)
        if (CheckIntegralTemplate(element))
            return GetTreeFromIntegralTemplate(element);
        if (CheckSubTemplate(element))
            return GetTreeFromSubTemplate(element);
        if (CheckSupTemplate(element))
            return GetTreeFromSupTemplate(element);
        if (CheckSuTemplate(element))
            return GetTreeFromSuTemplate(element);
        if (CheckOverTemplate(element))
            return GetTreeFromOverTemplate(element);
        if (CheckUnderTemplate(element))
            return GetTreeFromUnderTemplate(element);
        if (CheckVariableTemplate(element))
            return GetTreeFromVariableTemplate(element);

        // There are a few nodes such as the inline dy/dx in https://en.wikipedia.org/wiki/Calculus#Leibniz_notation
        //   that don't start with a span (in this case <style> or <link>) -- we don't know what they are so skip them
        if (element.nodeName !== "SPAN") {
            return new Node("row", "");
        }

        if (element.childNodes.length > 0) {
            return CreateRowNode(element);
        }
    }

    let pseudoScripts = String.fromCharCode(0x0022, 0x0027, 0x002A, 0x0060, 0x00AA,
            0x00B0, 0x00B2, 0x00B3, 0x00B4, 0x00B9, 0x00BA, 0x2018, 0x2019, 0x201A, 0x201B,
            0x201D, 0x201E, 0x201F, 0x2032, 0x2033, 0x2034, 0x2035, 0x2036, 0x2037, 0x2057);

    // Parse text
    let re = XRegExp("\\s*([0-9,\\.]+|\\pL+|[" + pseudoScripts + "]+|[^\\s])\\s*");
    let tokens = [];
    let m;
    let pos = 0;
    while (m = XRegExp.exec(element.textContent, re, pos, "sticky")) {
        tokens.push(m[1]);
        pos = m.index + m[0].length;
    }

    if (tokens.length === 1) {
        if (XRegExp.test(tokens[0], XRegExp("[" + pseudoScripts + "]+"))) {
            return new Node("sup", "", [new Node("text", tokens[0])]);
        } else {
            return new Node("text", tokens[0]);
        }
    } else {
        return new Node("row", "", tokens.map(function (token) {
            if (XRegExp.test(token, XRegExp("[" + pseudoScripts + "]+"))) {
                return new Node("sup", "", [new Node("text", token)]);
            } else {
                return new Node("text", token);
            }
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
            && element.classList.contains("sfrac")
            && element.childNodes.length === 3;
}

function CheckFractionTemplate2(element) {
    return element.nodeName === "SPAN"
            && element.classList.contains("frac")
            && element.childNodes.length === 3;
}

function CheckIntegralTemplate(element) {
    let integralSymbols = [String.fromCharCode(8747), //8747 is ∫
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

function CheckSuTemplate(element) {
    return element.nodeName === "SPAN" && (element.getAttribute("style") ===
            "display:inline-block;margin-bottom:-0.3em;vertical-align:-0.4em;line-height:1.2em;font-size:80%;text-align:left"
            || element.getAttribute("style") ===
            "display:inline-block;margin-bottom:-0.3em;vertical-align:-0.4em;line-height:1.2em;font-size:85%;text-align:right");
}

function CheckOverTemplate(element) {
    return element.nodeName === "SPAN" && element.getAttribute("style") ===
            "position:relative; margin-right:-0.75em; right:0.75em; bottom:0.75em;;";
}

function CheckUnderTemplate(element) {
    return element.nodeName === "SPAN" && element.getAttribute("style") ===
            "position:relative; margin-right:-0.75em; right:0.75em; top:0.45em;;";
}

function CheckVariableTemplate(element) {
    return (element.nodeName === "I"
            || (element.nodeName === "SPAN"
                    && element.getAttribute("style") === "font-style:italic;"))
            && element.childNodes.length === 1
            && element.childNodes[0].nodeName === "#text";
}

function CheckDelimTemplate(element) {
    return element.classList.contains("sfrac")
            && element.childNodes.length >= 4;
}

function GetTreeFromSqrtElement(element) {
    return new Node("sqrt", "", [GetTreeFromElement(element.childNodes[1])]);
}

function GetTreeFromRadicElement(element) {
    return new Node("radic", "", [GetTreeFromElement(element.childNodes[2]), GetTreeFromElement(element.childNodes[0].childNodes[0])]);
}

function GetTreeFromFractionTemplate(element) {
    if (element.childNodes[1].childNodes[0].data === "/") {
        return new Node("frac", "", [GetTreeFromElement(element.childNodes[0]),
            GetTreeFromElement(element.childNodes[2])]);
    } else {
        return new Node("row", "", [GetTreeFromElement(element.childNodes[0]), new Node("text", "+"), new Node("frac", "", [
                GetTreeFromElement(element.childNodes[2].childNodes[0]), GetTreeFromElement(element.childNodes[2].childNodes[2])])]);
    }
}

function GetTreeFromFractionTemplate2(element) {
    return new Node("frac", "", [GetTreeFromElement(element.childNodes[0].childNodes[0]),
        GetTreeFromElement(element.childNodes[2].childNodes[0])]);
}

function GetTreeFromIntegralTemplate(element) {
    let elementData = element.childNodes[1].childNodes.toArray();
    let brIndex = elementData.length;
    for (let i = 0; i < elementData.length; ++i) {
        if (elementData[i].nodeName === "BR") {
            brIndex = i;
            break;
        }
    }
    let upper = elementData.slice(0, brIndex);
    let lower = elementData.slice(brIndex + 1);
    let upperElement = new Node("row", "");
    if (upper.length > 1) {
        upperElement = new Node("row", "", upper.map(GetTreeFromElement));
    } else if (upper.length === 1) {
        upperElement = GetTreeFromElement(upper[0]);
    }

    let lowerElement = new Node("row", "");
    if (lower.length > 1) {
        lowerElement = new Node("row", "", lower.map(GetTreeFromElement));
    } else if (lower.length === 1) {
        lowerElement = GetTreeFromElement(lower[0]);
    }

    let children = [];
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

function GetTreeFromSuTemplate(element) {
    return new Node("su", "", [GetTreeFromElement(element.childNodes[2]), GetTreeFromElement(element.childNodes[0])]);
}

function GetTreeFromOverTemplate(element) {
    return new Node("sup", "2", [CreateRowNode(element)]);
}

function GetTreeFromUnderTemplate(element) {
    return new Node("sub", "2", [CreateRowNode(element)]);
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
    let leftType = "(", rightType = ")";
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
    let newNode = new Node("fence", leftType + rightType);
    for (let i = 2; i < element.childNodes.length - 2; i++) {
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
    let openFences = ["(", "[", "{"];
    let closeFences = [")", "]", "}"];

    while (node.children.some(function (child) {
        return child.type === "text" && openFences.includes(child.value);
    })) {
        let lastFencePos = -1;
        let lastFenceType = "";
        for (let i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            if (child.type === "text" && openFences.includes(child.value)) {
                lastFencePos = i;
                lastFenceType = child.value;
            } else if (child.type === "text" && closeFences.includes(child.value) && lastFencePos !== -1) {
                let newNode = new Node("fence", lastFenceType + child.value, node.children.splice(lastFencePos, i - lastFencePos + 1).slice(1, -1));
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
    } else if (node.type === "su") {
        if (node.children.length < 3) {
            node.type = "row";
        }
    } else {
        for (let i = 1; i < node.children.length; i++) {
            let child = node.children[i];
            if (child.type === "sub" || child.type === "sup") {
                if (child.children.length === 1) {
                    i--;
                    child.children.unshift(node.children.splice(i, 1)[0]);
                }
            } else if (child.type === "su") {
                if (child.children.length === 2) {
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
    let children = node.children.map(TreeToMathML);
    let elem = undefined;
    switch (node.type) {
        case "row":
            elem = document.createElement("mrow");
            for (let c of children) {
              elem.appendChild(c);
            }
            return elem;
        case "sqrt":
            elem = document.createElement("msqrt");
            for (let c of children) {
              elem.appendChild(c);
            }
            return elem;
        case "radic":
            elem = document.createElement("mroot");
            for (let c of children) {
              elem.appendChild(c);
            }
            return elem;
        case "frac":
            elem = document.createElement("mfrac");
            for (let c of children) {
              elem.appendChild(c);
            }
            return elem;
        case "integral":
            elem = document.createElement("msubsup");
            let mo = document.createElement("mo");
            mo.appendChild(document.createTextNode(node.value));
            elem.appendChild(mo);
            for (let c of children) {
              elem.appendChild(c);
            }
            return elem;
        case "sub":
            if (node.value === "2") {
                elem = document.createElement("munder");
                for (let c of children) {
                    elem.appendChild(c);
                }
                return elem;
            } else {
                elem = document.createElement("msub");
                for (let c of children) {
                    elem.appendChild(c);
                }
                return elem;
            }
        case "sup":
            if (node.value === "2") {
                elem = document.createElement("mover");
                for (let c of children) {
                    elem.appendChild(c);
                }
                return elem;
            } else {
                elem = document.createElement("msup");
                for (let c of children) {
                    elem.appendChild(c);
                }
                return elem;
            }
        case "su":
            elem = document.createElement("msubsup");
            for (let c of children) {
                elem.appendChild(c);
            }
            return elem;
        case "fence":
            if (node.children.length === 1) {
                elem = document.createElement("mrow");
                let mo1 = document.createElement("mo");
                mo1.appendChild(document.createTextNode(node.value.charAt(0)));
                let mo2 = document.createElement("mo");
                mo2.appendChild(document.createTextNode(node.value.charAt(1)));
                elem.appendChild(mo1);
                for (let c of children) {
                    elem.appendChild(c);
                }
                elem.appendChild(mo2);
                return elem;
            } else {
                let elem1 = document.createElement("mrow");
                let elem2 = document.createElement("mrow");
                let mo1 = document.createElement("mo");
                mo1.appendChild(document.createTextNode(node.value.charAt(0)));
                let mo2 = document.createElement("mo");
                mo2.appendChild(document.createTextNode(node.value.charAt(1)));
                elem1.appendChild(mo1);
                for (let c of children) {
                    elem2.appendChild(c);
                }
                elem1.appendChild(elem2);
                elem1.appendChild(mo2);
                return elem1;
            }
        case "text":
            if (XRegExp.test(node.value, XRegExp("\\pL+"))) {
                elem = document.createElement("mi");
                elem.appendChild(document.createTextNode(node.value));
                return elem;
            } else if ( !(node.value.length===1 && /[,\.]/.test(node.value)) && /[0-9,\.]+/.test(node.value) ) {
                elem = document.createElement("mn");
                elem.appendChild(document.createTextNode(node.value));
                return elem;
            } else {
                elem = document.createElement("mo");
                elem.appendChild(document.createTextNode(node.value));
                return elem;
            }
    }
}

function GetMathMLFromElement(element) {
    // Converts the span and its children into a MathML string
    // Returns a string representing the MathML or an empty string
    //   if it can’t do the conversion
    let node = GetTreeFromElement(element);
    TreePostProcessing(node);
    let mathml = TreeToMathML(node);
    if (element.className.includes("mathcal")) {
        style = document.createElement("mstyle");
        style.setAttribute("mathvariant", "script");
        style.appendChild(mathml);
        mathml = style;
    }
    
    let math = document.createElement("math");
    math.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
    // setting the role shouldn't be needed, but for some reason Chrome is picking up that this is math
    math.setAttribute("role", "math");

    math.appendChild(mathml);
    return math;
}

function CreateInvisibleMathMLNode(mathmlText) {
    // Creates a span node with attrs
    //   class="mwe-math-mathml-inline mwe-math-mathml-a11y"
    //   style="display: none;"}
    // The child of the span is mathml string converted to XML
    // Returns a span element
    let spanElement = document.createElement("SPAN");
    spanElement.setAttribute("class", "mwe-math-mathml-inline mwe-math-mathml-a11y");
    spanElement.setAttribute("style", "display: none;");
    spanElement.appendChild(mathmlText);
    return spanElement;
}

function FindMathElements(element) {
    if (element.className && (element.className.includes("texhtml")
            || element.className.includes("sfrac")
            || element.className.includes("mathcal")
            || (element.nodeName === "SPAN" && element.className === "nowrap" && !element.outerHTML.includes("mathml")))) {
        let mathmlText = GetMathMLFromElement(element);
        if (mathmlText) {
            // replace element with a new element that have as the children the new MathML element and this element
            // this mimics what is done for display math in Wikipedia
            let wrapper = document.createElement("SPAN");
            wrapper.setAttribute("class", "mwe-math-element");
            wrapper.appendChild( CreateInvisibleMathMLNode(mathmlText) );
        
            element.setAttribute("aria-hidden", "true");
            element.replaceWith(wrapper);
            wrapper.appendChild(element);
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
