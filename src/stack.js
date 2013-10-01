/**
 * Stack - an implementation of singly-linked lists
 * notation key
 * [a]                  = an instance of Stack with the function 'a'
 * [x]                  = the empty stack or undefined
 * <stack> -> <stack>   = a link between stacks
 * // <value>           = a return value
 * <action> :: <result> = the effect of a method
 * [a,b,c]              = an array of functions 'a', 'b', 'c'
 * [identity]           = an instance of Stack with 'identity' function
 * [a] -> b             = an instance of Stack with fn 'a' and a linked stack b
 * [a] -> [c] -> [x]    = an instance of Stack with fn 'a' and tail [c]
 * {x}                  = some value x
 * [{x},{y}]            = an array of values {x} and {y}
 * a(x, y)              = function 'a' invoked with arguments {x} and {y}
 * ?                    = an object
 * &&                   = logical and
 */

/**
 * @lends Stack
 */
(function (global, undef) {
    "use strict";
    function error() {
        throw new TypeError("Argument must be a function or Stack.");
    }

    function s4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    function guid() {
        return (s4() + s4() + "-" + s4() + s4() + "-" + s4() + "-" + s4() + s4() + s4()).toLowerCase();
    }

    /**
     * merge a second array-like object into the first
     * @param a {array|Arguments}
     * @param b {array|Arguments}
     * @returns {array|Arguments}
     */
    function merge(a, b) {
        Array.prototype.push.apply(a, b);
        return a;
    }

    /**
     * returns a strategy function
     * @param fn {function} for function param
     * @param stack {function} for stack param
     * @returns {function}
     */
    function stackable(fn, stack) {
        return function (a, b) {
            return !a ?
                fn.apply(this, [identity, b]) :
                typeof a === "function" ?
                    fn.apply(this, arguments) :
                    a.isStack ?
                        stack.apply(this, arguments) :
                        error();
        };
    }

    /**
     * @param [val {*}]
     * @returns {array}
     */
    function makeArray(val) {
        return Array.isArray(val) ? val : val ? [val] : [];
    }

    /**
     * returns its parameter or arguments object
     * @param [val {*}]
     * @returns {Arguments}
     */
    function identity(val) {
        return arguments.length > 1 ? arguments : val;
    }

    /**
     * @param arg {*}
     * @param [receiver {object}]
     * @returns {*}
     */
    function call(arg, receiver) {
        return this.fn.call(receiver || this, arg);
    }

    /**
     * @param args {array|Arguments}
     * @param [receiver {object}]
     * @returns {*}
     */
    function apply(args, receiver) {
        return this.fn.apply(receiver || this, args);
    }

    /**
     * for bouncing
     * @param fn {function}
     * @returns {function}
     */
    function trampoline(fn) {
        return function () {
            var bounce = fn.apply(this, arguments);
            while (typeof bounce === "function") {
                bounce = bounce();
            }
            return bounce;
        };
    }

    /**
     * returns a function capable of traversing the stack-list until
     * a condition is met then returning the current stack
     * @param matcher {function} condition to match
     * @param [transformer {function}] alters parameters
     * @returns {function}
     */
    function recur(matcher, transformer) {
        return trampoline(function recurring() {
            var self = this;
            var args = arguments;
            return function () {
                return matcher.apply(self, args) && self ||
                    self.next && recurring.apply(self.next, transformer ?
                        transformer.apply(this, args) :
                        args);
            };
        });
    }

    /**
     * @param fn {function}
     * @param receiver {Stack}
     * @param [args {Array}]
     * @constructor
     */
    function Continuation(fn, receiver, args) {
        this.fn = fn;
        this.receiver = receiver;
        this.args = args || [];
    }

    /**
     * help identify continuations without access to the constructor
     * @type {boolean}
     */
    Continuation.prototype.isContinuation = true;

    /**
     * complete the continued iteration
     * @param [args {Array}]
     * @param [receiver {Object}]
     * @returns {*}
     */
    Continuation.prototype.run = function (args, receiver) {
        return trampoline(this.fn).apply(receiver || this.receiver, args || this.args);
    };

    /**
     * value or state of a continuation
     * @returns {*}
     */
    Continuation.prototype.value = function () {
        return (this.args && this.args.length === 2 && this.args[1] === undef) ? this.args[0] : this.args;
    };

    /**
     * return a function capable of traversing the stack-list
     * executing an action on each stack until a limit is
     * reached and returning the accumulator or last value
     * @param action {function}
     * @param [accumulator {function}]
     * @param [limit {function}]
     * @returns {function}
     */
    function iterate(action, accumulator, limit) {
        return trampoline(function iterating() {
            var self = this;
            var args = arguments;
            if (self.debug) {
                self.id = self.id || guid();
                self.debug(self, args, action, accumulator, limit);
            }
            return function () {
                var val = action.apply(self, args);
                if (limit && limit.call(self, val)) {
                    return val;
                }
                if (val && val.isStack) {
                    return iterating.apply(val, args);
                }
                if (val === Stack.pause) {
                    return new Continuation(function () {
                        return iterating.apply(this, arguments);
                    }, self.next, accumulator ? accumulator.apply(self, args) : args);
                }
                if (val && val.then && val.inspect().state === "pending") {
                    return val.then(function () {
                        return self.next ?
                            iterating.apply(self.next, accumulator ?
                                accumulator.apply(self, args) :
                                args)() :
                            args;
                    });
                }
                return self.next ?
                    iterating.apply(self.next, accumulator ?
                        accumulator.apply(self, merge([val], args)) :
                        args) :
                    val;
            };
        });
    }

    //region Construction
    /**
     * Stack() // [identity] -> [x]
     * Stack(a) // [a] -> [x]
     * Stack([b] -> [c] -> [x]) // [b] -> [c] -> [x]
     * Stack([b] -> [c] -> [x], [a] -> [x]) // [b] -> [a] -> [x]
     * Stack([a,b,c]) // [c] -> [b] -> [a] -> [x]
     * Stack(a, [b] -> [x]) // [a] -> [b] -> [x]
     * Stack([a, [b] -> [c] -> [x]]) => [b] -> [c] -> [a] -> [x]
     * Stack([[a] -> [b] -> [x], [c] -> [x]]) //
     * @param fn {function|array}
     * @param next [{?Stack}]
     * @returns {Stack}
     * @constructor
     *
     * to debug a stack while iterating, place a debug method on the stack
     * to debug all stacks, place a debug method on the prototype
     * debugging stacks will generate a guid if they have no id
     * @example Stack.prototype.debug = function () {console.log(arguments);};
     */
    function Stack(fn, next) {
        var arr;
        if (Array.isArray(fn)) {
            arr = fn.slice(0);
            return arr.reduce(function (stack, f) {
                return stack.push(f);
            }, Stack.create(arr.shift()));
        }
        if (fn && fn.isStack) {
            return next && next.isStack ? new Stack(fn.fn, next) : fn;
        }
        if (!(this instanceof Stack)) {
            return new Stack(fn, next);
        }
        this.fn = fn || identity;
        this.next = next || undef;
    }

    /**
     * @param {Stack|function}
     * @static
     * @returns {Stack}
     * @throws {TypeError}
     */
    Stack.create = stackable(Stack, identity);

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.clone() // [a] -> [b] -> [c] -> [x]
     * stack.clone(d) // [d] -> [b] -> [c] -> [x]
     * stack.clone(null, [d]) // [a] -> [d] -> [x]
     * stack.clone(d, [e]) // [d] -> [e] ->  [x]
     * @param [fn {function}]
     * @param [next {Stack}]
     * @returns {Stack}
     */
    Stack.prototype.clone = function (fn, next) {
        return new Stack(fn || this.fn, next || this.next);
    };
    //endregion

    //region Utilities
    /**
     * the common pause object
     * @type {Object}
     */
    Stack.pause = {};

    /**
     * @param prop {string}
     * @param rename {string}
     * @static
     * @returns {object}
     */
    Stack.alias = function (prop, rename) {
        this.prototype[rename] = this.prototype[prop];
        return this;
    };

    /**
     * used to identify stack instances
     * @type {boolean}
     */
    Stack.prototype.isStack = true;

    /**
     * used to return a continuation from a stack iterator
     * @returns {Object}
     */
    Stack.prototype.pause = function () {
        return Stack.pause;
    };
    //endregion

    //region Manipulation
    /**
     * stack = [a] -> [x]
     * stack = stack.push(b) // [b] -> [a] -> [x]
     * stack.push([c] -> [x]) // [c] -> [b] -> [a] -> [x]
     * @param [fn {Stack|function}]
     * @returns {Stack}
     * @throws {TypeError}
     */
    Stack.prototype.push = stackable(function (fn) {
        return new Stack(fn, this);
    }, function (stack) {
        stack.precedent().next = this;
        return stack;
    });

    /**
     * removes the HEAD of a stack-list
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.pop() // [a] -> [x]
     * stack === [a] -> [x]
     * @returns {Stack}
     */
    Stack.prototype.pop = function () {
        this.next = undef;
        return this;
    };

    /**
     * removes the TAIL of a stack-list
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.shift() // [c] -> [x]
     * stack === [a] -> [b] -> [x]
     * @returns {Stack}
     */
    Stack.prototype.shift = function () {
        var p = this.superPrecedent();
        var removed = p.next;
        p.next = undef;
        return removed;
    };

    /**
     * place a stack at the TAIL of the stack-list
     * stack = [a] -> [b] -> [x]
     * stack.unshift(c) // [c] -> [x]
     * stack === [a] -> [b] -> [c] -> [x]
     * @param [fn {Stack|function}]
     * @returns {Stack}
     */
    Stack.prototype.unshift = function (fn) {
        return this.precedent().insert(fn);
    };

    /**
     * remove a stack from its stack-list
     * stack = [a] -> [x]
     * stack.drop() // undefined
     * stack = [a] -> [b] -> [x]
     * stack.drop() // [b] -> [x]
     * stack === [a] -> [x]
     */
    Stack.prototype.drop = function () {
        var next = this.next;
        this.next = undef;
        return next;
    };

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.remove() // [a] -> [c] -> [x]
     * @returns {Stack}
     */
    Stack.prototype.remove = function () {
        if (this.next) {
            this.next = this.next.next;
        }
        return this;
    };

    /**
     * stack = [a] -> [x]
     * stack.insert(b) // [b] -> [x]
     * stack.insert([b]) // [b] -> [x]
     * stack === [a] -> [b] -> [x]
     * @param [fn {Stack|function}]
     * @returns {Stack}
     * @throws {TypeError}
     */
    Stack.prototype.insert = stackable(function (fn) {
        return this.next = new Stack(fn, this.next);
    }, function (stack) {
        var next = this.next;
        this.next = stack;
        stack.next = next;
        return this;
    });

    /**
     * insert [a] before [b]
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.before(b, d) // [b] -> [d] -> [c] -> [x]
     * stack === [a] -> [b] -> [d] -> [c] -> [x]
     * @param [a {?Stack|function}]
     * @param [b {?Stack|function}]
     * @returns {Stack}
     * @throws {TypeError}
     */
    Stack.prototype.before = stackable(function (a, b) {
        return (this.using(a || undef) || this).insert(b);
    }, function (a, b) {
        return (this.precedent(a || undef) || this).insert(b);
    });
    //endregion

    //region Search
    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.index(1) // [b] -> [c] -> [x]
     * @param idx {number}
     * @returns {?Stack}
     */
    Stack.prototype.index = recur(function (val) {
        return val === 0;
    }, function (val) {
        return [--val];
    });

    /**
     * @param id {string}
     * @returns {?Stack}
     */
    Stack.prototype.find = recur(function (id) {
        return this.id === id;
    });

    /**
     * stack = [a] -> [x]
     * stack.uses(a) // true
     * @param [fn {function}]
     * @returns {boolean}
     */
    Stack.prototype.uses = function (fn) {
        return this.fn === fn;
    };

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.using(b) // [b] -> [c] -> [x]
     * @param [fn {function}]
     * @returns {?Stack}
     */
    Stack.prototype.using = recur(Stack.prototype.uses);

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.composedWith(b) // [a] -> [b] -> [c] -> [x]
     * @param [fn {function}]
     * @returns {?Stack}
     */
    Stack.prototype.composedWith = recur(function (fn) {
        return this.next && this.next.fn === fn;
    });

    /**
     * stack = [a] -> [b] -> [x]
     * stack.precedes([b] -> [x]) // true
     * @param [stack {Stack}]
     * @returns {boolean}
     */
    Stack.prototype.precedes = function (stack) {
        return this.next === stack;
    };

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.precedent([c] -> [x]) // [b] -> [c] -> [x]
     * @param [stack {Stack}]
     * @returns {?Stack}
     */
    Stack.prototype.precedent = recur(Stack.prototype.precedes);

    /**
     * stack = [a] -> [b] -> [c] -> [d] -> [x]
     * stack.superPrecedent([d] -> [x]) // [b] -> [c] -> [d] -> [x]
     * @param [stack {Stack}]
     * @returns {?Stack}
     */
    Stack.prototype.superPrecedent = recur(function (stack) {
        return this.next && this.next.next === stack;
    });

    /**
     * returns a function capable of traversing the stack-list until
     * a condition is met then returning the current stack
     * @param matcher {function} condition to match
     * @param transformer {function} alters parameters
     * @returns {function}
     */
    Stack.prototype.recur = recur;
    //endregion

    //region Execution
    /**
     * returns a function capable of traversing the stack-list
     * until a limit is reached and returning the accumulator
     * or last value
     * @param action
     * @param accumulator
     * @param limit
     * @returns {function}
     */
    Stack.prototype.iterate = iterate;

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.assign({x}) :: a(x), b(x), c(x) // c(x)
     * stack.assign({x}, ?) :: ?.a(x), ?.b(x), ?.c(x) // ?.c(x)
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {*|Continuation}
     */
    Stack.prototype.assign = iterate(call);

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.spread([{x},{y},{z}]) :: a(x,y,z), b(x,y,z), c(x,y,z) // c(x,y,z)
     * stack.spread([{x},{y},{z}], ?) :: ?.a(x,y,z), ?.b(x,y,z), ?.c(x,y,z) // ?.c(x,y,z)
     * @param [args {array}]
     * @param [receiver {object}]
     * @returns {undefined|Continuation}
     */
    Stack.prototype.spread = iterate(apply);

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.pipe({x}) // c(b(a(x)))
     * stack.pipe({x}, ?) // ?.c(?.b(?.a(x)))
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {*|Continuation}
     */
    Stack.prototype.pipe = iterate(call, function (val, arg, receiver) {
        return [val, receiver];
    });

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.funnel([{x},{y},{z}]) // c(b(a(x,y,z)))
     * stack.funnel([{x},{y},{z}], ?) // ?.c(?.b(?.a(x,y,z)))
     * @param [args {array}]
     * @param [receiver {object}]
     * @returns {*|Continuation}
     */
    Stack.prototype.funnel = iterate(apply, function (val, args, receiver) {
        return [makeArray(val), receiver];
    });

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.some() :: !c() && !b() && !c() // true|false
     * stack.some({x}) :: !c(x) && !b(x) && !c(x) // true|false
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {boolean|Continuation}
     */
    Stack.prototype.some = iterate(call, null, function (val) {
        return val === true;
    });

    /**
     * stack = [a] -> [b] -> [c] -> [x]
     * stack.every() :: c() && b() && c() // true|false
     * stack.every({x}) :: c(x) && b(x) && c(x) // true|false
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {boolean|Continuation}
     */
    Stack.prototype.every = iterate(call, null, function (val) {
        return val === false;
    });
    //endregion

    /**
     * @borrows push as from
     */
    Stack.alias("push", "from")
    /**
     * @borrows insert as to
     */
        .alias("insert", "to")
    /**
     * @borrows insert as compose
     */
        .alias("insert", "compose")
    /**
     * @borrows precedent as tail
     */
        .alias("precedent", "tail");

    global.Stack = Stack;
}(this));
