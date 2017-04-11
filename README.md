# ast-function-tools

A collection of helpers for modifying AST nodes of function types. It is
primarily targeted at generating instrumentation code, but feel free to open
issues or PRs if you want it to do more.

## Install

```sh
npm install ast-function-tools
```

## Usage

```js
var fnTools = require('ast-function-tools')
var escodegen = require('escodegen')
var esprima = require('esprima')

var code = esprima.parse(`
function delay(ms, done) {
  return setTimeout(done, ms)
}
delay(1000, () => {
  console.log('done')
})
`)

var fn = code.body[0]
fnTools.renameParameter(fn, 'done', '_done')
fnTools.prepend(fn, 'var start = process.hrtime()')
fnTools.append(fn, `
function done() {
  var end = process.hrtime(start)
  console.log('execution time: %ds', end[0] + end[1] / 1000000000)
  _done()
}
`)

console.log(escodegen.generate(declaration))
```

This will output this:

```js
function delay(ms, _done) {
    var start = process.hrtime();
    return setTimeout(done, ms);
    function done() {
        var end = process.hrtime(start);
        console.log('execution time: %ds', end[0] + end[1] / 1000000000);
        _done();
    }
}
delay(1000, () => {
    console.log('done');
});
```

---

### Copyright (c) 2017 Stephen Belanger
#### Licensed under MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
