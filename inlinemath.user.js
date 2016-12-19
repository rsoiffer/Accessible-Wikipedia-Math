// ==UserScript==
// @name          Inline accessible wikipedia math
// @namespace     http://www.talkingcatsoftware.com/gmscripts
// @description   Makes math authored with the "math" template accessible by adding a MathML equivalent to the template output
// @include       https://*.wikipedia.org/*
// @include       C:\Users\*\Wikipedia-replacement-test.html
// @version       0.1.0
// @ icon         http://www.example.net/icon.png
// ==/UserScript==

alert("I'm running");

function GetMathMLFromElement(spanElement) {
  // Converts the span and its children into a MathML string
  // Returns a string representing the MathML or an empty string
  //   if it can’t do the conversion
  console.log("In GetMathMLFromElement: " + spanElement.innerHTML);
  return "<math xmlns='http://www.w3.org/1998/Math/MathML'> \
 <msqrt>\
  <msup>\
   <mi>x</mi>\
   <mn>3</mn>\
  </msup>\
 </msqrt>\
</math>";
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
};

function Main() {
  console.log("Running Main()");
  var texhtmlElements = document.getElementsByClassName("texhtml");
  console.log("Found " + texhtmlElements.length + " texhtml elements to change")
  var i;
  for (i=0; i<texhtmlElements.length; i++) {
	var element = texhtmlElements[i];
    var mathmlText = GetMathMLFromElement(element)
    if (mathmlText) {
      element.setAttribute("aria-hidden", "true");
	  var mathmlSpan = CreateInvisibleMathMLNode(mathmlText);
	  element.parentElement.insertBefore(mathmlSpan, element);
    }
  console.log("All done");
  }
}

Main();