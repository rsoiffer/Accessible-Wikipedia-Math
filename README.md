This extension is only activated for pages on `wikipedia.org`.
It should work with any AT that reads math in MathML. This includes JAWS, NVDA, VoiceOver, and Orca.

Wikipedia has three main ways to author math: using the `<math>` tag with a version of TeX inside, using the "texhtml" template, and using "raw" HTML (`<i>`, `<sup>`, etc) or its wiki equivalent.

The `<math>` tag is used for almost all larger math expressions. The math template (along with the similar "nowrap" template) is used for smaller math expressions, especially those that are inline. Some authors use raw HTML, but that is pretty limited as it is not as easy to author.

Wikipedia makes math accessible by hiding MathML next to the image it produces. Assistive Technology (AT) can then convert the MathML to speech or braille. This add-on extends that trick to the math templates by converting the HTML mess that is produced into MathML and inserting hidden MathML back into the document. The original output is hidden from AT by marking it with aria-hidden="true". Thus, the sighted user see the original expression and the AT only sees the MathML.

The improvement this extension makes varies with the page and the language. In the English pages, it makes a significant improvement: almost all but a few percent of the mathematical expressions are made accessible with this extension. The same is true to a somewhat lesser extent for the French pages. Most German, Asian, and Arabic pages appear to use embedded MathML and so the extension probably won't help for those languages because they are already accessible. If in doubt, try it out.

This extension helps for displayed math also (mainly English pages). Many Wikipedia pages place larger math expressions on their own line inside of a list tag, probably for presentation reasons. However, this causes screen readers to say "list with one item" ... "out of list" for each piece of display math. This extension adds role="presentation" so that AT does not see the math as being a list and just reads the math. The display of the math is unaffected.

For more information, see https://en.wikipedia.org/wiki/Wikipedia:Rendering_math

Note: there is now a wikipedia project to do this conversion directly, but the project currently does not have a timeline for when it will be worked on and completed. This add-on fills in the gap until the project is implemented and deployed.


## Privacy Policy
This extension does NOT collect any user data. What you read on Wikipedia is your business, not ours.