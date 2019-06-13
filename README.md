[![Build Status](https://travis-ci.org/kaelzhang/error-stack.svg?branch=master)](https://travis-ci.org/kaelzhang/error-stack)
[![Coverage](https://codecov.io/gh/kaelzhang/error-stack/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/error-stack)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/error-stack?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/error-stack)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/error-stack.svg)](http://badge.fury.io/js/error-stack)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/error-stack.svg)](https://www.npmjs.org/package/error-stack)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/error-stack.svg)](https://david-dm.org/kaelzhang/error-stack)
-->

# error-stack

Parse and manipulate `error.stack`

## Install

```sh
$ npm i error-stack
```

## Usage

```js
const parse = require('error-stack')
const {stack} = new Error('foo')

console.log(stack)
// Error: foo
//     at repl:1:11
//     at Script.runInThisContext (vm.js:123:20)

const parsed = parse(stack)

parsed.type // Error

parsed.message  // foo

parsed.traces
// [
//   {
//     callee: undefined,
//     source: 'repl',
//     line: 1,
//     col: 11
//   },
//   {
//     callee: 'Script.runInThisContext',
//     source: 'vm.js',
//     line: 123,
//     col: 20
//   }
// ]

parsed
.filter(({callee}) => !!callee)
.format()
// Error: foo
//     at Script.runInThisContext (vm.js:123:20)
```

### parsed.type `string`

Error type

### parsed.message `string`

The message used by Error constructor

### parsed.traces `Array<Trace>`

```ts
interface Source {
  // The source of the the callee
  source: string
  line?: number
  col?: number
}

interface Trace extends Source{
  callee: string
  // Whether the callee is 'eval'
  eval?: boolean
  // The source location inside eval content
  evalTrace: Source
}
```

### parsed.filter(filterFunction): this

- **filterFunction** `Function` the same as the callback function of `Array.prototype.filter(callback)`

Filters the current traces

### parsed.format(): string

Format object `parsed`

## License

[MIT](LICENSE)
