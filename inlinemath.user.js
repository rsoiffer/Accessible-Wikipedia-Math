// ==UserScript==
// @name          Inline accessible wikipedia math
// @namespace     http://www.talkingcatsoftware.com/gmscripts
// @description   Makes math authored with the "math" template accessible by adding a MathML equivalent to the template output
// @include       https://*.wikipedia.org/*
// @include       C:\Users\*\Wikipedia-replacement-test.html
// @version       0.1.0
// @icon          http://www.example.net/icon.png
// ==/UserScript==

alert("I'm running");

function GetMathMLFromElement(spanElement) {
  // Converts the span and its children into a MathML string
  // Returns a string representing the MathML or an empty string
  //   if it can’t do the conversion
  GM_log("In GetMathMLFromElement: " + spanElement.outerText);
  return `<math display='block' xmlns='http://www.w3.org/1998/Math/MathML'>
 <msqrt>
  <msup>
   <mi>x</mi>
   <mn>3</mn>
  </msup>
 </msqrt>
</math>`
}

function CreateInvisibleMathMLNode(mathMLText) {
  // Creates a span node with attrs
  //   class="mwe-math-mathml-inline mwe-math-mathml-a11y"
  //   style="display: none;"}
  // The child of the span is mathml string converted to XML
  // Returns a span element
  GM_log("In CreateInvisibleMathMLNode: " + mathMLText);
  var spanElement = document.createElement("SPAN");
  spanElement.innerHTML = mathMLText;
  return spanElement;  
}

function Main() {
  GM_log("Running Main()");
  var texhtmlElements = document.getElementsByClassName("example");
  var element;
  for (element in texhtmlElements) {
    var mathmlText = GetMathMLFromElement(element)
    if (mathmlText) {
      element.setAttribute("aria-hidden", "true");
      element.parentNode.insertbefore(CreateInvisibleMathMLNode(mathmlText), element);
    }
  }

Main()