stack
=====

Pass Stack function(s):
* Each instance of Stack is a stack _NODE_
* Each stack _NODE_ is a stack _HEAD_
* Each stack _NODE_ with an *undefined* `next` property is a stack _TAIL_

Ease of use:
* Treat stacks like arrays or lists ([singly linked lists](http://en.wikipedia.org/wiki/Linked_list#Singly_linked_list) actually)
* Many array methods are implemented using the same signature as native functions

Recursion:
* Stack.call and Stack.apply compose functions in (LIFO) order.
* Each stack _HEAD_ can be called or applied, piping its function's output until it returns from the stack _TAIL_
* Stack.some and Stack.every allow analysis
* All recursive methods implement a trampoline to avoid stack overflow

Possible uses:
* Create lists of functions to compose
* Create lists of handlers to fire (e.g., PubSub)
* Create complex conditional tests
* Build complex interactions while keeping your functions separated and testable

TODO
====
* document branching logic
* test and document continuation objects

<pre>
StackInstance
::= head-tail/head ( precedent? | ( stack* | )? superPrecedent  precedent | )? tail

Stack
::= 'new'? 'Stack(' (Function ( StackInstance |) | ( '[' ( Function | StackInstance )* ']' ) ) ')' StackInstance

call
::= StackInstance '.call(' '*' ( ',' Object )? ')' ( call )* '*'

apply
::= StackInstance '.apply(' '[' '*'* ']' ( ',' Object )? ')' ( apply )* '*' 
</pre>
