
<!--#echo json="package.json" key="name" underline="=" -->
pre2gfmarkdown-pmb
==================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
ultramarked + highlight.js + pre tag finder = drop one script tag into your
HTML to replace pre tags with their content rendered as Github-flavored
markdown.
<!--/#echo -->

For syntax highlight in code snippets, you'll still need to import
[a compatible style sheet][hljs-styles].


Usage
-----

See the code of [this demo](docs/demo/hello.html)
([live on Github][ghp-demo]).

<!--#toc stop="scan" -->



Known issues
------------

* Needs more/better tests and docs.




&nbsp;

  [hljs-styles]: https://github.com/highlightjs/highlight.js/tree/master/src/styles
  [ghp-demo]: https://mk-pmb.github.io/pre2gfmarkdown-pmb-js/docs/demo/hello.html

License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
