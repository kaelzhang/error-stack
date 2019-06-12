/* eslint-disable new-cap */
/* eslint-disable no-eval */
const test = require('ava')
const log = require('util').debuglog('error-stack')
const parse = require('..')

const CASES = [
  [
    'Error',
    new Error('foo').stack,
    (t, {message, type}) => {
      t.is(message, 'foo')
      t.is(type, 'Error')
    }
  ],
  [
    'TypeError',
    new TypeError('foo').stack,
    (t, {message, type}) => {
      t.is(message, 'foo')
      t.is(type, 'TypeError')
    }
  ],
  [
    'Custom Error',
    () => {
      class xxx1Error extends TypeError {}
      return new xxx1Error('foo').stack
    },
    (t, {message, type}) => {
      t.is(message, 'foo')
      t.is(type, 'TypeError')
    }
  ],
  [
    'Eval',
    eval('new Error("foo")').stack,
    (t, {
      traces: [{
        callee,
        source,
        evalTrace
      }]
    }) => {
      t.is(callee, 'eval')
      t.is(source, __filename)
      t.is(evalTrace.source, '<anonymous>')
    }
  ]
]

const createTester = object => (t, parsed) => {
  t.deepEqual(parsed, object)
}

CASES.forEach(([title, stack, object], i) => {
  test(`${title || i}`, t => {
    if (typeof stack === 'function') {
      stack = stack()
    }

    stack = stack.trim()
    const parsed = parse(stack)
    log('parsed: %j\n', parsed)

    const tester = typeof object === 'function'
      ? object
      : createTester(object)

    tester(t, parsed)

    t.is(stack, parsed.format(), 'format')
  })
})

test('invalid stack', t => {
  t.throws(() => parse(), TypeError)
})

test('filter and format', t => {
  const stack = `Error: foo
    at repl:1:11
    at Script.runInThisContext (vm.js:123:20)`

  t.is(
    parse(stack).filter(({callee}) => !!callee).format(),
    `Error: foo
    at Script.runInThisContext (vm.js:123:20)`)
})
