var escapeRegexp = require('escape-string-regexp')
var esprima = require('esprima')
var assert = require('assert')

const types = [
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression'
]
exports.isFunction = isFunction
function isFunction(node) {
  return !!~types.indexOf(node.type)
}

exports.prepend = prepend
function prepend(ast, code) {
  assertIsFunction(ast)
  ast.body.body = toBody(code).concat(ast.body.body)
}

exports.append = append
function append(ast, code) {
  assertIsFunction(ast)
  ast.body.body = ast.body.body.concat(toBody(code))
}

exports.renameParameter = renameParameter
function renameParameter(ast, matcher, replacer) {
  assertIsFunction(ast)

  if (!(matcher instanceof RegExp)) {
    matcher = new RegExp(escapeRegexp(matcher))
  }

  ast.params.forEach(function(param) {
    if (matcher.test(param.name)) {
      param.name = typeof replacer === 'function'
        ? replacer(param.name)
        : replacer
    }
  })
}

//
// Helpers
//
function assertIsFunction(node) {
  assert(isFunction(node), 'AST node should be one of: ' + types.join(', '))
}

function toBody(code) {
  if (typeof code === 'string') {
    return esprima.parse(code).body
  }
  if (!Array.isArray(code)) {
    return [code]
  }
  return code
}
