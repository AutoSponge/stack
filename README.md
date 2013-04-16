stack
=====

Pass Stack functions then call or apply your stack in (LIFO) order.
* Each instance of Stack is a stack _NODE_
* Each stack _NODE_ is a stack _HEAD_
* Each stack _HEAD_ can be called or applied, piping its function's output until it returns from the stack _TAIL_
* Each stack _NODE_ with an *undefined* `next` property is a stack _TAIL_

`var stack = Stack();`
Create an instance of Stack with the default "passing" function (HEAD, TAIL). `stack = Stack(defaultFn)`

`var stack = Stack(fn);`
Create an instance of Stack with fn (HEAD, TAIL). `stack = Stack(fn1, undefined)`

`var stack = Stack(fn2).push(fn1);`
Create an instance of Stack with fn2 (TAIL). `Stack(fn2, undefined)` or `stack.next`
Push an instance of Stack with fn1 (HEAD). `stack = Stack(fn1, fn2)`

`var stack = Stack([fn2, fn1]);`
Create an instance of Stack with fn2 (TAIL). `Stack(fn2, undefined)` or `stack.next`
Push an instance of Stack with fn1 (HEAD). `stack = Stack(fn1, fn2)`

`var stack = Stack(fn1);`
`stack.unshift(fn2)`
Create an instance of Stack with fn1 (HEAD). `stack = Stack(fn1)`
Create instance of Stack with fn2 (TAIL) and update stack.next. `Stack(fn1, fn2), Stack(fn2, undefined)` or `stack.next`

TODO
====
* create branching logic (CPS?)
* create worker implementation (needs async call/apply)
* rewrite stack iteration to use trampolining and avoid stack limits
