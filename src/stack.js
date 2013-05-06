/**
 * Stack
 * notation key
 * a                    = function 'a'
 * [a]                  = an instance of Stack with the function 'a'
 * <action> => <result> = a transformation of the Stack/Stack sequence
 * <action> // <result> = a return value
 * <action> || <result> = the effect of the <action>
 * [a,b,c]              = an array of functions 'a', 'b', 'c'
 * [identity]            = an instance of Stack with 'identity' function
 * [a[b]]               = an instance of Stack with function 'a' and a next [b]
 * [a[b[c]]]            = an instance of Stack with the head [a] and tail [c]
 * {x}                  = some value x
 * [{x},{y}]            = an array of values {x} and {y}
 * a(x)                 = function 'a' invoked with argument {x}
 * a(x, y)              = function 'a' invoked with arguments {x} and {y}
 * ?                    = an object
 * &&                   = logical and
 */
(function(global, undef) {
    function merge(a, b) {
        Array.prototype.push.apply(a, b);
        return a;
    }
    function makeArray(val) {
        return Array.isArray(val) ? val : val ? [val] : [];
    }
    function identity(val) {
        return arguments.length > 1 ? arguments : val;
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
                    self.next && recurring.apply(self.next, transformer ? transformer.apply(this, args) : args);
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
                return self.next ? iterating.apply(self.next, accumulator ? accumulator.apply(self, merge([val], args)) : args) : val;
            };
        });
    }
    /**
     * Stack
     * Stack() => [identity] // [identity]
     * Stack(a) => [a] // [a]
     * Stack([a,b,c]) => [c[b[a]]] // [c[b[a]]]
     * Stack(a, [b]) => [a[b]] // [a[b]]
     * @param fn {Function|Array}
     * @param [next {Stack}]
     * @returns {Stack}
     * @constructor
     */
    function Stack(fn, next) {
        var arr;
        if (Array.isArray(fn)) {
            arr = fn.slice(0);
            return arr.reduce(function (stack, f) {
                return stack.push(f);
            }, new Stack(arr.shift()));
        }
        if (!(this instanceof Stack)) {
            return new Stack(fn, next);
        }
        this.fn = fn || identity;
        this.next = next || undef;
    }

    /**
     * mung
     * @param prop
     * @param rename
     * @static
     * @returns Stack
     */
    Stack.mung = function (prop, rename) {
        this.prototype[rename] = this.prototype[prop];
        return this;
    };
    /**
     * push
     * [a].push(b) => [b[a]].push(c) => [c[b[a]]] // [c[b[a]]]
     * @param fn {Function}
     * @returns {Stack}
     */
    Stack.prototype.push = function(fn) {
        return new Stack(fn, this);
    };
    /**
     * insert
     * [a].insert(b) => [a[b]] // [b].insert(c) => [a[b[c]]] // [c]
     * @param fn
     * @returns {Stack}
     */
    Stack.prototype.insert = function (fn) {
        return this.next = new Stack(fn, this.next);
    };
    /**
     * index
     * [a[b[c]]].index(1) // [b]
     * @param idx
     * @returns {Stack|undefined}
     */
    Stack.prototype.index = recur(function (i) {
        return i===0;
    }, function (i) {
        i--;
        return arguments;
    });

    /**
     * priorNext
     * [a[b[c[d]]]].priorNext([d]) // [b]
     * @param [stack]
     * @returns {Stack|undefined}
     */
    Stack.prototype.priorNext = recur(function (stack) {
        return this.next && this.next.next === stack;
    });
    /**
     * priorFn
     * [a[b[c]]].priorFn(b) // [a]
     * @param fn
     * @returns {Stack|undefined}
     */
    Stack.prototype.priorFn = recur(function (fn) {
        return this.next && this.next.fn === fn;
    });
    /**
     * isNext
     * [a[b]].isNext([b]) // true
     * @param stack
     * @returns {boolean}
     */
    Stack.prototype.isNext = function (stack) {
        return this.next === stack;
    };
    /**
     * isFn
     * [a].isFn(a) // true
     * @param fn
     * @returns {boolean}
     */
    Stack.prototype.isFn = function (fn) {
        return this.fn === fn;
    };
    /**
     * searchNext
     * [a[b[c]]].searchNext([c]) // [b[c]]
     * @param [stack]
     * @returns {Stack|undefined}
     */
    Stack.prototype.searchNext = recur(Stack.prototype.isNext);
    /**
     * searchFn
     * [a[b[c]]].searchFn(b) // [b]
     * @param fn
     * @returns {Stack|undefined}
     */
    Stack.prototype.searchFn = recur(Stack.prototype.isFn);
    /**
     * distribute
     * [a[b[c]]].distribute({x}) || a(x), b(x), c(x)
     * [a[b[c]]].distribute({x}, ?) || ?.a(x), ?.b(x), ?.c(x)
     * @param arg
     * @param receiver
     * @returns {undefined}
     */
    Stack.prototype.distribute = iterate(function (arg, receiver) {
        this.fn.call(receiver || self, arg);
    });
    /**
     * distributeAll
     * [a[b[c]]].distribute([{x},{y},{z}]) || a(x,y,z), b(x,y,z), c(x,y,z)
     * [a[b[c]]].distribute([{x},{y},{z}], ?) || ?.a(x,y,z), ?.b(x,y,z), ?.c(x,y,z)
     * @param args
     * @param receiver
     * @returns {undefined}
     */
    Stack.prototype.distributeAll = iterate(function (args, receiver) {
        this.fn.apply(receiver || self, args);
    });
    /**
     * call
     * [a[b[c]]].call({x}) // c(b(a(x)))
     * [a[b[c]]].call({x}, ?) // ?.c(?.b(?.a(x)))
     * @param arg
     * @param receiver
     * @returns {*}
     */
    Stack.prototype.call = iterate(function (arg, receiver) {
        return this.fn.call(receiver || this, arg);
    }, function (val, arg, receiver) {
        return [val, receiver];
    });
    /**
     * apply
     * [a[b[c]]].apply([{x},{y},{z}]) // c(b(a(x,y,z)))
     * [a[b[c]]].apply([{x},{y},{z}], ?) // ?.c(?.b(?.a(x,y,z)))
     * @param args
     * @param receiver
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
     * @param fn
     * @param next
     * @returns {Stack}
     */
    Stack.prototype.clone = function (fn, next) {
        return new Stack(fn || this.fn, next || this.next);
    };
    /**
     * tail
     * [a[b[c]]].tail() // [c]
     * @returns {Stack|undefined}
     */
    Stack.prototype.tail = function () {
        return this.searchNext();
    };
    /**
     * unshift
     * [a[b]].unshift(c) => [a[b[c]]] // [c]
     * @param fn
     * @returns {Stack}
     */
    Stack.prototype.unshift = function (fn) {
        return this.tail().insert(fn);
    };
    /**
     * before
     * [a[b[c]]].before(b, d) => [a[d[b[c]]]] // [d[b[c]]]
     * @param a
     * @param b
     * @returns {Stack}
     */
    Stack.prototype.beforeFn = function (a, b) {
        return (this.searchFn(a || undef) || this).insert(b);
    };
    /**
     * after
     * [a[b[c]]].after(b, d) => [a[b[d[c]]]] // [b[d[c]]]
     * @param a
     * @param b
     * @returns {Stack}
     */
    Stack.prototype.before = function (a, b) {
        return (this.searchFn(a || undef) || this).insert(b);
    };
    /**
     * shift
     * [a[b[c]]].shift() => [a[b]] // [c]
     * @returns {Stack}
     */
    Stack.prototype.shift = function () {
        var p = this.priorNext();
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
     * some
     * [a[b[c]]].some() || !c() && !b() && !c() // true|false
     * [a[b[c]]].some({x}) || !c(x) && !b(x) && !c(x) // true|false
     * @param arg
     * @param receiver
     * @returns {boolean}
     */
    Stack.prototype.some = iterate(function (arg, receiver) {
        return this.fn.call(receiver || self, arg);
    }, null, identity);
    /**
     * every
     * [a[b[c]]].every() || c() && b() && c() // true|false
     * [a[b[c]]].every({x}) || c(x) && b(x) && c(x) // true|false
     * @param arg
     * @param receiver
     * @returns {boolean}
     */
    Stack.prototype.every = iterate(function (arg, receiver) {
        return this.fn.call(receiver || this, arg);
    }, null, function (val) {
        return val === false;
    });
    /**
     * [a].push(b) = [a].after(b) = [a].composedWith(b) => [b[a]] // [b[a]]
     * [a].insert(b) = [a].before(b) = [a].then(b) => [a[b]] // [b]
     * [a[b]].isNext([b]) = [a[b]].composes([b]) // true
     * [a].isFn(a) = [a].with(a) = [a].uses(a) // true
     * [a[b]].searchNext([b]) =
     */
    Stack.mung("push", "of")
        .mung("insert", "to")
        .mung("insert", "compose");

//        .mung("isNext", "follows")
//        .mung("isFn", "with")
//        .mung("isFn", "uses")
//        .mung("searchNext", "of")
//        .mung("searchFn", "using")
//        .mung("priorNext", "previousActsOn")
//        .mung("priorFn", "composedWith");

    global.Stack = Stack;
}(this));
