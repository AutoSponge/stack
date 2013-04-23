/**
 * Stack
 * notation key
 * a                    = function 'a'
 * [a]                  = an instance of Stack with the function 'a'
 * <action> => <result> = a transformation of the Stack/Stack sequence
 * <action> // <result> = a return value
 * <action> || <result> = the effect of the <action>
 * [a,b,c]              = an array of functions 'a', 'b', 'c'
 * [default]            = an instance of Stack with 'defaultFn' function
 * [a][b]               = an instance of Stack with function 'a' and a next [b]
 * [a][b][c]            = an instance of Stack with the head [a] and tail [c]
 * {x}                  = some value x
 * [{x},{y}]            = an array of values {x} and {y}
 * a({x})               = function 'a' invoked with argument {x}
 * a({x}, {y})          = function 'a' invoked with arguments {x} and {y}
 * ?                    = an object
 */
(function(global, undef) {
    function makeArray(val) {
        return Array.isArray(val) ? val : val ? [val] : [];
    }
    function defaultFn() {
        return arguments.length > 1 ? arguments : arguments[0];
    }
    /**
     * Stack
     * Stack() => [default] //[default]
     * Stack(a) => [a] //[a]
     * Stack([a,b,c]) => [a][b][c] //[a][b][c]
     * Stack(a, [b]) => [a][b] //[a][b]
     * @param fn {Function|Array}
     * @param [next {Stack}]
     * @returns {Stack}
     * @constructor
     */
    function Stack(fn, next) {
        if (Array.isArray(fn)) {
            return fn.reduce(function (stack, f) {
                return stack.push(f);
            }, new Stack(fn.shift()));
        }
        if (!(this instanceof Stack)) {
            return new Stack(fn, next);
        }
        this.fn = fn || defaultFn;
        this.next = next || undef;
    }
    /**
     * push
     * [a].push(b) => [a][b].push(c) => [a][b][c] //[a][b][c]
     * @param fn {Function}
     * @returns {Stack}
     */
    Stack.prototype.push = function(fn) {
        return new Stack(fn, this);
    };
    /**
     * insert
     * [a].insert(c) => [a][c].insert(b) => [a][b][c] //[a][b][c]
     * @param fn
     * @returns {Stack}
     */
    Stack.prototype.insert = function (fn) {
        return this.next = new Stack(fn, this.next);
    };
    /**
     * index
     * [a][b][c].index(1) // [b]
     * @param idx
     * @returns {Stack|undefined}
     */
    Stack.prototype.index = function (idx) {
        return !idx ? this : this.next && this.next.index(idx - 1);
    };
    /**
     * priorNext
     * [a][b][c][d].priorNext([d]) // [b]
     * @param [stack]
     * @returns {Stack|undefined}
     */
    Stack.prototype.priorNext = function (stack) {
        return this.next && this.next.next === stack ? this : this.next && this.next.priorNext(stack);
    };
    /**
     * priorFn
     * [a][b][c].priorNext(b) // [a]
     * @param fn
     * @returns {Stack|undefined}
     */
    Stack.prototype.priorFn = function (fn) {
        return (this.next && this.next.fn === fn) ? this : this.next && this.next.priorFn(fn);
    };
    /**
     * isNext
     * [a][b].isNext([b]) //true
     * @param stack
     * @returns {boolean}
     */
    Stack.prototype.isNext = function (stack) {
        return stack === this.next;
    };
    /**
     * isFn
     * [a].isFn(a) //true
     * @param fn
     * @returns {boolean}
     */
    Stack.prototype.isFn = function (fn) {
        return fn === this.fn;
    };
    /**
     * searchNext
     * [a][b][c].searchNext([c]) //[b]
     * @param [stack]
     * @returns {Stack|undefined}
     */
    Stack.prototype.searchNext = function (stack) {
        return this.isNext(stack) && this || this.next && this.next.searchNext(stack);
    };
    /**
     * searchFn
     * [a][b][c].searchFn(b) //[b]
     * @param fn
     * @returns {Stack|undefined}
     */
    Stack.prototype.searchFn = function (fn) {
        return this.isFn(fn) && this || this.next && this.next.searchFn(fn);
    };
    /**
     * distribute
     * [a][b][c].distribute({x}) || a({x}), b({x}), c({x})
     * [a][b][c].distribute({x}, ?) || ?.a({x}), ?.b({x}), ?.c({x})
     * @param arg
     * @param receiver
     * @returns {undefined}
     */
    Stack.prototype.distribute = function (arg, receiver) {
        this.fn.call(receiver || this, arg);
        this.next && this.next.distribute(arg, receiver || this);
    };
    /**
     * distributeAll
     * [a][b][c].distribute([{x},{y},{z}]) || a({x},{y},{z}), b({x},{y},{z}), c({x},{y},{z})
     * [a][b][c].distribute([{x},{y},{z}], ?) || ?.a({x},{y},{z}), ?.b({x},{y},{z}), ?.c({x},{y},{z})
     * @param args
     * @param receiver
     * @returns {undefined}
     */
    Stack.prototype.distributeAll = function (args, receiver) {
        this.fn.apply(receiver|| this, args);
        this.next && this.next.distributeAll(makeArray(args), receiver || this);
    };
    /**
     * call
     * [a][b][c].call({x}) // a(b(c({x})))
     * [a][b][c].call({x}, ?) // ?.a(?.b(?.c({x})))
     * @param arg
     * @param receiver
     * @returns {*}
     */
    Stack.prototype.call = function (arg, receiver) {
        var val = this.fn.call(receiver || this, arg);
        return this.next && val !== false ? this.next.call(val, receiver || this) : val;
    };
    /**
     * apply
     * [a][b][c].apply([{x},{y},{z}]) // a(b(c({x},{y},{z})))
     * [a][b][c].apply([{x},{y},{z}], ?) // ?.a(?.b(?.c({x},{y},{z})))
     * @param args
     * @param receiver
     * @returns {*}
     */
    Stack.prototype.apply = function (args, receiver) {
        var val = this.fn.apply(receiver|| this, args);
        return this.next && val !== false ? this.next.apply(makeArray(val), receiver || this) : val;
    };
    /**
     * clone
     * [a][b][c].clone() // [a][b][c]
     * [a][b][c].clone(d) // [d][b][c]
     * [a][b][c].clone(null, [d]) // [a][d]
     * [a][b][c].clone(d, [e]) // [d][e]
     * @param fn
     * @param next
     * @returns {Stack}
     */
    Stack.prototype.clone = function (fn, next) {
        return new Stack(fn || this.fn, next || this.next);
    };
    /**
     * tail
     * [a][b][c].tail() // [c]
     * @returns {Stack|undefined}
     */
    Stack.prototype.tail = function () {
        return this.searchNext();
    };
    /**
     * unshift
     * [a][b].unshift(c) => [a][b][c] // [c]
     * @param fn
     * @returns {Stack}
     */
    Stack.prototype.unshift = function (fn) {
        return this.tail().insert(fn);
    };
    /**
     * before
     * [a][b][c].before(b, d) => [a][d][b][c] // [d][b][c]
     * @param a
     * @param b
     * @returns {Stack}
     */
    Stack.prototype.before = function (a, b) {
        return (this.searchFn(a || undef) || this).insert(b);
    };
    /**
     * shift
     * [a][b][c].shift() => [a][b] // [c]
     * @returns {Stack}
     */
    Stack.prototype.shift = function () {
        var p = this.priorNext();
        var removed = p.next;
        p.next = undef;
        return removed;
    };
    /**
     * [a][b][c].pop() => [a], [b][c] // [a]
     * @returns {*}
     */
    Stack.prototype.pop = function () {
        this.next = undef;
        return this;
    };
    global.Stack = Stack;
}(this));
