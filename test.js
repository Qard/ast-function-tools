var escodegen = require('escodegen')
var esprima = require('esprima')
var fnTools = require('./')
var tap = require('tap')

function modify(fn) {
  fnTools.prepend(fn, 'var start = process.hrtime()')
  fnTools.append(fn, `
  function done() {
    var end = process.hrtime(start)
    console.log('execution time: %ds', end[0] + end[1] / 1000000000)
    _done()
  }
  `)
  fnTools.renameParameter(fn, 'done', '_done')
}

//
// Declarations
//
var declaration = esprima.parse(`
function delay(ms, done) {
  return setTimeout(done, ms)
}
delay(1000, () => {
  console.log('done')
})
`)

modify(declaration.body[0])

tap.equal(
  escodegen.generate(declaration),
`function delay(ms, _done) {
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
});`,
  'modifies function declarations'
)

//
// Expressions
//
var declaration = esprima.parse(`
var delay = function(ms, done) {
  return setTimeout(done, ms)
}
delay(1000, () => {
  console.log('done')
})
`)

modify(declaration.body[0].declarations[0].init)

tap.equal(
  escodegen.generate(declaration),
`var delay = function (ms, _done) {
    var start = process.hrtime();
    return setTimeout(done, ms);
    function done() {
        var end = process.hrtime(start);
        console.log('execution time: %ds', end[0] + end[1] / 1000000000);
        _done();
    }
};
delay(1000, () => {
    console.log('done');
});`,
  'modifies function expressions'
)

//
// Arrow functions
//
var arrow = esprima.parse(`
var delay = (ms, done) => {
  return setTimeout(done, ms)
}
delay(1000, () => {
  console.log('done')
})
`)

modify(arrow.body[0].declarations[0].init)

tap.equal(
  escodegen.generate(arrow),
`var delay = (ms, _done) => {
    var start = process.hrtime();
    return setTimeout(done, ms);
    function done() {
        var end = process.hrtime(start);
        console.log('execution time: %ds', end[0] + end[1] / 1000000000);
        _done();
    }
};
delay(1000, () => {
    console.log('done');
});`,
  'modifies arrow function expressions'
)

//
// Invalid types throw
//
var variable = esprima.parse('var foo')
tap.throws(
  function() { modify(variable) },
  'AST node should be one of: ArrowFunctionExpression, FunctionDeclaration, FunctionExpression',
  'non-function types throw a type assertion'
)

//
// RegExp parameter matchers
//
var variable = esprima.parse('function foo(bar) {}')
tap.doesNotThrow(function() {
  fnTools.renameParameter(variable.body[0], /^b/, 'baz')
}, 'does not reject regex matchers')
tap.equal(
  escodegen.generate(variable),
  'function foo(baz) {\n}',
  'finds parameters with regex'
)

//
// Parameter replacer function
//
var variable = esprima.parse('function foo(bar, baz) {}')
tap.doesNotThrow(function() {
  fnTools.renameParameter(variable.body[0], /^b/, function(v) {
    return v.toUpperCase()
  })
}, 'does not reject replacer functions')
tap.equal(
  escodegen.generate(variable),
  'function foo(BAR, BAZ) {\n}',
  'modifies parameters with replacer function'
)

const types = [
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression'
]
types.forEach(function(type) {
  tap.equal(
    fnTools.isFunction({ type: type }),
    true,
    'identifies "' + type + '" as a valid type'
  )
})
tap.equal(
  fnTools.isFunction({ type: 'nope' }),
  false,
  'rejects invalid types'
)
