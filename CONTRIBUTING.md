Contributing
===============
This document briefly lists the guidelines for contributing to JSON Editor.

Reporting Bugs
----------------
When creating an issue in GitHub, try to include when feasible:
*  A brief description of the issue
*  An example JSON schema that causes the issue
*  Steps to reproduce

If you can reproduce the issue on the demo page (http://jeremydorn.com/json-editor/), it's helpful to attach the "Direct Link" url (top right of page).  Note: the direct link might not work for very large schemas or JSON values.


Contributing Code
--------------------------
One of the major goals of JSON Editor is to be easy to modify and hack.

If you fix a bug or add a cool feature, please submit a pull request!


### Code Style

*  Use 2 spaces for indentation
*  Use comments whenever the code's meaning is not obvious
*  When in doubt, try to match the style in existing source files

###Grunt

The easiest way to hack on JSON Editor is to run `grunt watch`, which 
re-builds `dist/jsoneditor.js` every time a source file changes.

To do a full grunt build which includes jshint and minification, run `grunt`.

### Submitting Pull Requests
Try to limit pull requests to a single narrow feature or bug fix.

__Do not submit `dist/` files!__ 

The following is done when a pull request is accepted.  There is no need to do any of these steps yourself.

1.  Merge pull request into master
2.  Increment version number in `src/intro.js` and `bower.json`.  Set date in `src/intro.js`.
3.  Build `dist/` files with grunt
4.  Commit and push to github
5.  Add a git tag and release for this version with a short changelog

Sometimes, multiple pull requests will be merged before doing steps 2-5.
