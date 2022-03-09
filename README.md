# Accessible-Wikipedia-Math

Wikipedia has three main ways to author math: using the <math> tag with a version of TeX inside, using the "texhtml" template, and using "raw" HTML (<i>, <sup>, etc) or its wiki equivalent.

The <math> tag is used for almost all larger math expressions. The math template (along with the similar "nowrap" template) is used for smaller math expressions, especially those that are inline. Some authors use raw HTML, but that is pretty limited as it is not as easy to author.

Wikipedia makes <math> math form accessible by hiding MathML next to the image it produces. Assistive Technology (AT) can then convert the MathML to speech or braille. This add-on extends that trick to the math and nowrap templates by converting the HTML mess that is produced into MathML and inserting hidden MathML back into the document. The original output is hidden from AT by marking it with aria-hidden="true". Thus, the sighted user see the original expression and the AT only sees the MathML.

As a guess, 75%-80% of the math in wikipedia is written with the math tag, with almost all but a few percent of the remainder using the math or nowrap templates. Hence, this addon makes a significant difference to the accessibility of wikipedia pages.

For more information, see https://en.wikipedia.org/wiki/Wikipedia:Rendering_math

Note: there is now a wikipedia project to do this conversion directly, but the project currently does not have a timeline for when it will be worked on and completed. This add-on fills in the gap until the project is implemented and deployed.
