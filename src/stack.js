/**
 * Stack - an implementation of singly-linked lists
 * notation key
 * a                    = function 'a'
 * [a]                  = an instance of Stack with the function 'a'
 * <action> => <result> = a transformation of the Stack/Stack sequence
 * <action> // <result> = a return value
 * <action> || <result> = the effect of the <action>
 * [a,b,c]              = an array of functions 'a', 'b', 'c'
 * [identity]           = an instance of Stack with 'identity' function
 * [a[b]]               = an instance of Stack with function 'a' and a next [b]
 * [a[b[c]]]            = an instance of Stack with the head [a] and tail [c]
 * {x}                  = some value x
 * [{x},{y}]            = an array of values {x} and {y}
 * a(x)                 = function 'a' invoked with argument {x}
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

    function merge(a, b) {
        Array.prototype.push.apply(a, b);
        return a;
    }

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

    function makeArray(val) {
        return Array.isArray(val) ? val : val ? [val] : [];
    }

    function identity(val) {
        return arguments.length > 1 ? arguments : val;
    }

    function call(arg, receiver) {
        return this.fn.call(receiver || this, arg);
    }

    function apply(args, receiver) {
        return this.fn.apply(receiver || this, args);
    }

    function trampoline(fn) {
        return function () {
            var bounce = fn.apply(this, arguments);
            while (typeof bounce === "function") {
                bounce = bounce();
            }
            return bounce;
        };
    }

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
     * @param args {Array}
     * @constructor
     */
    function Continuation(fn, receiver, args) {
        this.fn = fn;
        this.receiver = receiver;
        this.args = args;
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

    /**
     * Stack() => [identity] // [identity]
     * Stack(a) => [a] // [a]
     * Stack([a,b,c]) => [c[b[a]]] // [c[b[a]]]
     * Stack(a, [b]) => [a[b]] // [a[b]]
     * Stack([a, [b[c]]]) => [b[c[a]]] // [b[c[a]]]
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
        if (!(this instanceof Stack)) {
            return new Stack(fn, next);
        }
        this.fn = fn || identity;
        this.next = next || undef;
    }

    /**
     * the common pause object
     * @type {Object}
     */
    Stack.pause = {};
    /**
     * @param {Stack|function}
     * @static
     * @returns {Stack}
     * @throws {TypeError}
     */
    Stack.create = stackable(Stack, identity);
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
    /**
     * [a[b[c]]].clone() // [a[b[c]]]
     * [a[b[c]]].clone(d) // [d[b[c]]]
     * [a[b[c]]].clone(null, [d]) // [a[d]]
     * [a[b[c]]].clone(d, [e]) // [d[e]]
     * @param [fn {function}]
     * @param [next {Stack}]
     * @returns {Stack}
     */
    Stack.prototype.clone = function (fn, next) {
        return new Stack(fn || this.fn, next || this.next);
    };
    /**
     * [a].push(b) => [b[a]].push(c) => [c[b[a]]] // [c[b[a]]]
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
     * [a[b[c]]].pop() => [a], [b[c]] // [a]
     * @returns {Stack}
     */
    Stack.prototype.pop = function () {
        this.next = undef;
        return this;
    };
    /**
     * [a[b[c]]].shift() => [a[b]] // [c]
     * @returns {Stack}
     */
    Stack.prototype.shift = function () {
        var p = this.superPrecedent();
        var removed = p.next;
        p.next = undef;
        return removed;
    };
    /**
     * [a[b]].unshift(c) => [a[b[c]]] // [c]
     * @param [fn {Stack|function}]
     * @returns {Stack}
     * @throws {TypeError}
     */
    Stack.prototype.unshift = function (fn) {
        return this.precedent().insert(fn);
    };
    /**
     * [a].drop() // undefined
     * [a[b]].drop() => [a], [b] // [b]
     */
    Stack.prototype.drop = function () {
        var next = this.next;
        this.next = undef;
        return next;
    };
    /**
     * [a[b[c]]].remove() => [a[c]] // [a[c]]
     * @returns {Stack}
     */
    Stack.prototype.remove = function () {
        if (this.next) {
            this.next = this.next.next;
        }
        return this;
    };
    /**
     * [a].insert(b) => [a[b]] // [b].insert(c) => [a[b[c]]] // [c]
     * [a].insert([b]) => [a[b]] // [b].insert([c]) => [a[b[c]]] // [c]
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
     * [a[b[c]]].before(b, d) => [a[b[d[c]]]] // [b[d[c]]]
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
    /**
     * [a[b[c]]].index(1) // [b]
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
     * [a].uses(a) // true
     * @param [fn {function}]
     * @returns {boolean}
     */
    Stack.prototype.uses = function (fn) {
        return this.fn === fn;
    };
    /**
     * [a[b[c]]].using(b) // [b]
     * @param [fn {function}]
     * @returns {?Stack}
     */
    Stack.prototype.using = recur(Stack.prototype.uses);
    /**
     * [a[b[c]]].composedWith(b) // [a]
     * @param [fn {function}]
     * @returns {?Stack}
     */
    Stack.prototype.composedWith = recur(function (fn) {
        return this.next && this.next.fn === fn;
    });
    /**
     * [a[b]].precedes([b]) // true
     * @param [stack {Stack}]
     * @returns {boolean}
     */
    Stack.prototype.precedes = function (stack) {
        return this.next === stack;
    };
    /**
     * [a[b[c]]].precedent([c]) // [b[c]]
     * @param [stack {Stack}]
     * @returns {?Stack}
     */
    Stack.prototype.precedent = recur(Stack.prototype.precedes);
    /**
     * [a[b[c[d]]]].superPrecedent([d]) // [b]
     * @param [stack {Stack}]
     * @returns {?Stack}
     */
    Stack.prototype.superPrecedent = recur(function (stack) {
        return this.next && this.next.next === stack;
    });
    /**
     * [a[b[c]]].distribute({x}) || a(x), b(x), c(x)
     * [a[b[c]]].distribute({x}, ?) || ?.a(x), ?.b(x), ?.c(x)
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {*|Continuation}
     */
    Stack.prototype.distribute = iterate(call);
    /**
     * [a[b[c]]].distributeAll([{x},{y},{z}]) || a(x,y,z), b(x,y,z), c(x,y,z)
     * [a[b[c]]].distributeAll([{x},{y},{z}], ?) || ?.a(x,y,z), ?.b(x,y,z), ?.c(x,y,z)
     * @param [args {array}]
     * @param [receiver {object}]
     * @returns {undefined|Continuation}
     */
    Stack.prototype.distributeAll = iterate(apply);
    /**
     * [a[b[c]]].call({x}) // c(b(a(x)))
     * [a[b[c]]].call({x}, ?) // ?.c(?.b(?.a(x)))
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {*|Continuation}
     */
    Stack.prototype.call = iterate(call, function (val, arg, receiver) {
        return [val, receiver];
    });
    /**
     * [a[b[c]]].apply([{x},{y},{z}]) // c(b(a(x,y,z)))
     * [a[b[c]]].apply([{x},{y},{z}], ?) // ?.c(?.b(?.a(x,y,z)))
     * @param [args {array}]
     * @param [receiver {object}]
     * @returns {*|Continuation}
     */
    Stack.prototype.apply = iterate(apply, function (val, args, receiver) {
        return [makeArray(val), receiver];
    });
    /**
     * [a[b[c]]].some() || !c() && !b() && !c() // true|false
     * [a[b[c]]].some({x}) || !c(x) && !b(x) && !c(x) // true|false
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {boolean|Continuation}
     */
    Stack.prototype.some = iterate(call, null, function (val) {
        return val === true;
    });
    /**
     * [a[b[c]]].every() || c() && b() && c() // true|false
     * [a[b[c]]].every({x}) || c(x) && b(x) && c(x) // true|false
     * @param [arg {*}]
     * @param [receiver {object}]
     * @returns {boolean|Continuation}
     */
    Stack.prototype.every = iterate(call, null, function (val) {
        return val === false;
    });
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
