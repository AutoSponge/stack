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
    function makeArray(val) {
        return Array.isArray(val) ? val : val ? [val] : [];
    }
    function identity() {
        return arguments.length > 1 ? arguments : arguments[0];
    }
    function recur(fn) {
        return function () {
            var bounce = fn.apply(this, arguments);
            while (typeof bounce === "function") {
                bounce = bounce();
            }
            return bounce;
        };
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
    Stack.prototype.index = recur(function index(idx) {
        var self = this;
        return function () {
            return !idx ? self : self.next && index.call(self.next, idx - 1);
        };
    });
    /**
     * priorNext
     * [a[b[c[d]]]].priorNext([d]) // [b]
     * @param [stack]
     * @returns {Stack|undefined}
     */
    Stack.prototype.priorNext = recur(function priorNext(stack) {
        var self = this;
        return function () {
            return self.next && self.next.next === stack ? self : self.next && priorNext.call(self.next, stack);
        };
    });
    /**
     * priorFn
     * [a[b[c]]].priorFn(b) // [a]
     * @param fn
     * @returns {Stack|undefined}
     */
    Stack.prototype.priorFn = recur(function priorFn(fn) {
        var self = this;
        return function () {
            return (self.next && self.next.fn === fn) ? self : self.next && priorFn.call(self.next, fn);
        };
    });
    /**
     * isNext
     * [a[b]].isNext([b]) // true
     * @param stack
     * @returns {boolean}
     */
    Stack.prototype.isNext = function (stack) {
        return stack === this.next;
    };
    /**
     * isFn
     * [a].isFn(a) // true
     * @param fn
     * @returns {boolean}
     */
    Stack.prototype.isFn = function (fn) {
        return fn === this.fn;
    };
    /**
     * searchNext
     * [a[b[c]]].searchNext([c]) // [b]
     * @param [stack]
     * @returns {Stack|undefined}
     */
    Stack.prototype.searchNext = recur(function searchNext(stack) {
        var self = this;
        return function () {
            return self.isNext(stack) && self || self.next && searchNext.call(self.next, stack);
        };
    });
    /**
     * searchFn
     * [a[b[c]]].searchFn(b) // [b]
     * @param fn
     * @returns {Stack|undefined}
     */
    Stack.prototype.searchFn = recur(function searchFn(fn) {
        var self = this;
        return function () {
            return self.isFn(fn) && self || self.next && searchFn.call(self.next, fn);
        };
    });
    /**
     * distribute
     * [a[b[c]]].distribute({x}) || a(x), b(x), c(x)
     * [a[b[c]]].distribute({x}, ?) || ?.a(x), ?.b(x), ?.c(x)
     * @param arg
     * @param receiver
     * @returns {undefined}
     */
    Stack.prototype.distribute = recur(function distribute(arg, receiver) {
        var self = this;
        return function () {
            self.fn.call(receiver || self, arg);
            return self.next && distribute.call(self.next, arg, receiver || self);
        };
    });
    /**
     * distributeAll
     * [a[b[c]]].distribute([{x},{y},{z}]) || a(x,y,z), b(x,y,z), c(x,y,z)
     * [a[b[c]]].distribute([{x},{y},{z}], ?) || ?.a(x,y,z), ?.b(x,y,z), ?.c(x,y,z)
     * @param args
     * @param receiver
     * @returns {undefined}
     */
    Stack.prototype.distributeAll = recur(function distributeAll(args, receiver) {
        var self = this;
        return function () {
            self.fn.apply(receiver|| self, args);
            return self.next && distributeAll.call(self.next, makeArray(args), receiver || self);
        };
    });
    /**
     * call
     * [a[b[c]]].call({x}) // c(b(a(x)))
     * [a[b[c]]].call({x}, ?) // ?.c(?.b(?.a(x)))
     * @param arg
     * @param receiver
     * @returns {*}
     */
    Stack.prototype.call = recur(function call(arg, receiver) {
        var self = this;
        return function () {
            var val = self.fn.call(receiver || self, arg);
            return self.next && call.call(self.next, val, receiver) || val;
        };
    });
    /**
     * apply
     * [a[b[c]]].apply([{x},{y},{z}]) // c(b(a(x,y,z)))
     * [a[b[c]]].apply([{x},{y},{z}], ?) // ?.c(?.b(?.a(x,y,z)))
     * @param args
     * @param receiver
     * @returns {*}
     */
    Stack.prototype.apply = recur(function apply(args, receiver) {
        var self = this;
        return function () {
            var val = self.fn.apply(receiver|| self, args);
            return self.next && apply.call(self.next, makeArray(val), receiver) || val;
        }
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
    Stack.prototype.some = recur(function some(arg, receiver) {
        var self = this;
        return function () {
            var val = self.fn.call(receiver || self, arg);
            return val !== true && !self.next ? false :
                self.next && val !== true ? some.call(self.next, arg, receiver) :
                    true;
        };
    });
    /**
     * every
     * [a[b[c]]].every() || c() && b() && c() // true|false
     * [a[b[c]]].every({x}) || c(x) && b(x) && c(x) // true|false
     * @param arg
     * @param receiver
     * @returns {boolean}
     */
    Stack.prototype.every = recur(function every(arg, receiver) {
        var self = this;
        return function () {
            var val = self.fn.call(receiver || self, arg);
            return val !== false && !self.next ? true :
                self.next && val !== false ? every.call(self.next, arg, receiver) :
                    false;
        };
    });
    /**
     * [a].push(b) = [a].after(b) = [a].composedWith(b) => [b[a]] // [b[a]]            t o h      a o b
     * [a].insert(b) = [a].before(b) = [a].then(b) => [a[b]] // [b]
     * [a[b]].isNext([b]) = [a[b]].composes([b]) // true
     * [a].isFn(a) = [a].with(a) = [a].uses(a) // true
     * [a[b]].searchNext([b]) =
     */
    Stack.mung("push", "of")
        .mung("push", "after")
        .mung("insert", "to")
        .mung("insert", "compose");
        //.mung("insert", "before"); before already used, aop-style, should add after in the same vein
        //insert, push, etc. operations should take Stack; insertFn, pushFn, etc. should take Fn
        //need a way to name and index stacks for reporting/debugging/graphing
        //setup tests for alternate grammars
        //add branching logic (probably limited by the stack limits on # of branches)

//        .mung("isNext", "follows")
//        .mung("isFn", "with")
//        .mung("isFn", "uses")
//        .mung("searchNext", "of")
//        .mung("searchFn", "using")
//        .mung("priorNext", "previousActsOn")
//        .mung("priorFn", "composedWith");

    global.Stack = Stack;
}(this));
