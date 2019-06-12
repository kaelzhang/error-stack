// 1.
// Error: foo
// 2.
// TypeError: foo
// 3.
// ```js
// class xxx123Error extends Error {}
// new xxx123Error('foo')
// ```
// xxx123Error: foo
// 4.
// ```js
// class r extends xxx123Error {}
// ```
// r [Error]: foo
const REGEX_MATCH_MESSAGE = /^([a-z][a-z0-9_]*):\s+(.+)$/i

const REGEX_REMOVE_AT = /^at\s+/
const REGEX_STARTS_WITH_EVAL_AT = /^eval\s+at\s+/

const trim = s => s.trim()

const breakBrackets = (str, first, last) => {
  if (!str.endsWith(last)) {
    return [str]
  }

  let firstIndex
  let cursor = str.length - 1
  // There is already the last one
  let count = 1
  while (-- cursor >= 0) {
    const char = str.charAt(cursor)
    if (char === last) {
      count ++
    } else if (char === first) {
      if (-- count === 0) {
        firstIndex = cursor
        break
      }
    }
  }

  return [
    str.slice(0, firstIndex),
    str.slice(firstIndex + 1, - 1)
  ].map(trim)
}

const parseSource = rawSource => {
  const [source, line, col] = rawSource.split(':')
  return {
    source, line, col
  }
}

const parseEvalSource = rawEvalSource => {
  const [rawTrace, rawEvalTrace] = rawEvalSource
  .replace(REGEX_STARTS_WITH_EVAL_AT, '')
  .split(/,\s+/g)
  .map(trim)

  const {
    source,
    line,
    col
  // eslint-disable-next-line no-use-before-define
  } = parseTrace(rawTrace)

  const evalTrace = parseSource(rawEvalTrace)

  return {
    source,
    line,
    col,
    evalTrace
  }
}

const parseTrace = (trace, testEvalSource) => {
  const t = trace.replace(REGEX_REMOVE_AT, '')

  let [
    rawCallee, rawSource
  ] = breakBrackets(t, '(', ')')

  if (!rawSource) {
    [rawCallee, rawSource] = [rawSource, rawCallee]
  }

  const ret = {}

  if (rawCallee) {
    const [
      callee, calleeNote
    ] = breakBrackets(rawCallee, '[', ']')

    ret.callee = callee
    ret.calleeNote = calleeNote
  } else {
    ret.callee = rawCallee
  }

  if (ret.callee === 'eval') {
    ret.eval = true
  }

  Object.assign(
    ret,
    testEvalSource && REGEX_STARTS_WITH_EVAL_AT.test(rawSource)
      ? parseEvalSource(rawSource)
      : parseSource(rawSource)
  )

  return ret
}

const parse = stack => {
  const [rawMessage, ...rawTrace] = stack
  .split(/\r|\n/g)
  .map(trim)
  // Empty line
  .filter(Boolean)

  const [, type, message] = rawMessage.match(REGEX_MATCH_MESSAGE)
  const traces = rawTrace.map(t => parseTrace(t, true))

  return {
    type, message, traces
  }
}

const formatTrace = ({
  callee,
  calleeNote,
  source,
  line,
  col
}) => {
  const sourceTrace = [
    source,
    line,
    col
  ]
  .filter(Boolean)
  .join(':')

  const note = calleeNote
    ? ` [${calleeNote}]`
    : ''

  return callee
    ? `${callee}${note} (${sourceTrace})`
    : sourceTrace
}

const formatEvalTrace = ({
  callee,
  evalTrace,
  ...trace
}) =>
  `${callee} (eval at ${formatTrace({
    ...trace,
    callee: '<anonymous>'
  })}, ${formatTrace(evalTrace)})`

const formatMessage = ({
  type,
  message
}) => `${type}: ${message}`

class ErrorStack {
  constructor (stack) {
    if (typeof stack !== 'string') {
      throw new TypeError('stack must be a string')
    }

    Object.assign(this, parse(stack))
  }

  filter (filter) {
    this.traces = this.traces.filter(filter)

    return this
  }

  format () {
    const {type, message} = this
    const firstLine = `${formatMessage({type, message})}\n`

    return firstLine + this.traces.map(
      trace => `    at ${
        trace.eval
          ? formatEvalTrace(trace)
          : formatTrace(trace)
      }`
    )
    .join('\n')
  }
}

module.exports = stack => new ErrorStack(stack)
