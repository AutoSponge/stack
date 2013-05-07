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
(function(global, undef) {
    "use strict";
    function error() {
        throw new TypeError("Argument must be a function or Stack.");
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
    function isFalse(val) {
        return val === false;
    }
    function call(arg, receiver) {
        return this.fn.call(receiver || this, arg);
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
    function iterate(action, accumulator, limit) {
        return trampoline(function iterating() {
            var self = this;
            var args = arguments;
            return function () {
                var val = action.apply(self, args);
                if (limit && limit.call(self, val)) {
                    return val;
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
     * Stack
     * Stack() => [identity] // [identity]
     * Stack(a) => [a] // [a]
     * Stack([a,b,c]) => [c[b[a]]] // [c[b[a]]]
     * Stack(a, [b]) => [a[b]] // [a[b]]
     * Stack([a, [b[c]]]) => [b[c[a]]] // [b[c[a]]]
     * @param fn {function|array}
     * @param next [{?Stack}]
     * @returns {Stack}
     * @constructor
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
     * create
     * @param {Stack|function}
     * @static
     * @returns Stack
     * @throws TypeError
     */
    Stack.create = stackable(Stack, identity);
    /**
     * alias
     * @param prop {string}
     * @param rename {string}
     * @static
     * @returns Stack
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
     * push
     * [a].push(b) => [b[a]].push(c) => [c[b[a]]] // [c[b[a]]]
     * @param fn {Stack|function}
     * @returns {Stack}
     * @throws TypeError
     */
    Stack.prototype.push = stackable(function (fn) {
        return new Stack(fn, this);
    }, function (stack) {
        stack.precedent().next = this;
        return stack;
    });
    /**
     * insert
     * [a].insert(b) => [a[b]] // [b].insert(c) => [a[b[c]]] // [c]
     * [a].insert([b]) => [a[b]] // [b].insert([c]) => [a[b[c]]] // [c]
     * @param {Stack|function}
     * @returns {Stack}
     * @throws TypeError
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
     * unshift
     * [a[b]].unshift(c) => [a[b[c]]] // [c]
     * @param fn {Stack|function}
     * @returns {Stack}
     */
    Stack.prototype.unshift = function (fn) {
        return this.precedent().insert(fn);
    };
    /**
     * insert [a] before [b]
     * [a[b[c]]].before(b, d) => [a[b[d[c]]]] // [b[d[c]]]
     * @param a {?Stack|function}
     * @param b {?Stack|function}
     * @returns {Stack}
     * @throws TypeError
     */
    Stack.prototype.before = stackable(function (a, b) {
        return (this.using(a || undef) || this).insert(b);
    }, function (a, b) {
        return (this.precedent(a || undef) || this).insert(b);
    });
    /**
     * shift
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
     * [a[b[c]]].pop() => [a], [b[c]] // [a]
     * @returns {Stack}
     */
    Stack.prototype.pop = function () {
        this.next = undef;
        return this;
    };
    /**
     * index
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
     * isFn
     * [a].isFn(a) // true
     * @param fn {function}
     * @returns {boolean}
     */
    Stack.prototype.uses = function (fn) {
        return this.fn === fn;
    };
    /**
     * using
     * [a[b[c]]].using(b) // [b]
     * @param fn {function}
     * @returns {?Stack}
     */
    Stack.prototype.using = recur(Stack.prototype.uses);
    /**
     * composedWith
     * [a[b[c]]].composedWith(b) // [a]
     * @param fn {function}
     * @returns {?Stack}
     */
    Stack.prototype.composedWith = recur(function (fn) {
        return this.next && this.next.fn === fn;
    });
    /**
     * precedes
     * [a[b]].precedes([b]) // true
     * @param stack {Stack}
     * @returns {boolean}
     */
    Stack.prototype.precedes = function (stack) {
        return this.next === stack;
    };
    /**
     * precedent
     * [a[b[c]]].precedent([c]) // [b[c]]
     * @param {?Stack}
     * @returns {?Stack}
     */
    Stack.prototype.precedent = recur(Stack.prototype.precedes);
    /**
     * superPrecedent
     * [a[b[c[d]]]].superPrecedent([d]) // [b]
     * @param {?Stack}
     * @returns {?Stack}
     */
    Stack.prototype.superPrecedent = recur(function (stack) {
        return this.next && this.next.next === stack;
    });
    /**
     * distribute
     * [a[b[c]]].distribute({x}) || a(x), b(x), c(x)
     * [a[b[c]]].distribute({x}, ?) || ?.a(x), ?.b(x), ?.c(x)
     * @param arg {*}
     * @param receiver {object}
     * @returns {undefined}
     */
    Stack.prototype.distribute = iterate(function (arg, receiver) {
        this.fn.call(receiver || self, arg);
    });
    /**
     * distributeAll
     * [a[b[c]]].distribute([{x},{y},{z}]) || a(x,y,z), b(x,y,z), c(x,y,z)
     * [a[b[c]]].distribute([{x},{y},{z}], ?) || ?.a(x,y,z), ?.b(x,y,z), ?.c(x,y,z)
     * @param args {array}
     * @param receiver {object}
     * @returns {undefined}
     */
    Stack.prototype.distributeAll = iterate(function (args, receiver) {
        this.fn.apply(receiver || self, args);
    });
    /**
     * call
     * [a[b[c]]].call({x}) // c(b(a(x)))
     * [a[b[c]]].call({x}, ?) // ?.c(?.b(?.a(x)))
     * @param arg {*} 
     * @param receiver {object}
     * @returns {*}
     */
    Stack.prototype.call = iterate(call, function (val, arg, receiver) {
        return [val, receiver];
    });
    /**
     * apply
     * [a[b[c]]].apply([{x},{y},{z}]) // c(b(a(x,y,z)))
     * [a[b[c]]].apply([{x},{y},{z}], ?) // ?.c(?.b(?.a(x,y,z)))
     * @param args {array}
     * @param receiver {object}
     * @returns {*}
     */
    Stack.prototype.apply = iterate(function (args, receiver) {
        return this.fn.apply(receiver || this, args);
    }, function (val, args, receiver) {
        return [makeArray(val), receiver];
    });
    /**
     * clone
     * [a[b[c]]].clone() // [a[b[c]]]
     * [a[b[c]]].clone(d) // [d[b[c]]]
     * [a[b[c]]].clone(null, [d]) // [a[d]]
     * [a[b[c]]].clone(d, [e]) // [d[e]]
     * @param fn {function}
     * @param next {Stack}
     * @returns {Stack}
     */
    Stack.prototype.clone = function (fn, next) {
        return new Stack(fn || this.fn, next || this.next);
    };
    /**
     * some
     * [a[b[c]]].some() || !c() && !b() && !c() // true|false
     * [a[b[c]]].some({x}) || !c(x) && !b(x) && !c(x) // true|false
     * @param arg {*}
     * @param receiver {object}
     * @returns {boolean}
     */
    Stack.prototype.some = iterate(call, null, identity);
    /**
     * every
     * [a[b[c]]].every() || c() && b() && c() // true|false
     * [a[b[c]]].every({x}) || c(x) && b(x) && c(x) // true|false
     * @param arg {*}
     * @param receiver {object}
     * @returns {boolean}
     */
    Stack.prototype.every = iterate(call, null, isFalse);
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
