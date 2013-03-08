(function(global, undef) {
    function isPrimitive(val) {
        return Object(val) !== val;
    }
    function isArrayLike(val) {
        return !isPrimitive(val) && 
            typeof val !== "function" &&
            val.length && 
            val.hasOwnProperty(0);
    }
    function makeArray(val) {
        return isArrayLike(val) ? val : val ? [val] : [];
    }
    function defaultFn() {
        return arguments.length > 1 ? arguments : arguments[0];
    }
    function each(arr, fn) {
        var i, len;
        for (i = 0, len = arr.length; i < len; i += 1) {
            fn(arr[i], i, arr);
        }
    }
    function Stack(fn, next) {
        if (isArrayLike(fn)) {
            var stack;
            each(fn, function (f) {
                stack = stack ? stack.push(f) : new Stack(f);
            });
            return stack;
        }
        if (!(this instanceof Stack)) {
            return new Stack(fn, next);
        }
        this.fn = fn || defaultFn;
        this.next = next || undef;
    }
    Stack.prototype.push = function(fn) {
        return new Stack(fn, this);
    };
    Stack.prototype.insert = function (fn) {
        return this.next = new Stack(fn, this.next);
    };
    Stack.prototype.concat = function (arr) {
        var prev = this;
        arr.forEach(function (fn) {
            prev = prev.unshift(fn);
        });
        return this;
    };
    Stack.prototype.index = function (idx) {
        return !idx ? this : this.next && this.next.index(idx - 1);
    };
    Stack.prototype.search = function (fn) {
        return (this.fn === fn) ? this : this.next && this.next.search(fn);
    };
    Stack.prototype.call = function (arg, reciever) {
        var val = this.fn.call(reciever || this, arg);
        return this.next ? this.next.call(val, reciever || this) : val;
    };
    Stack.prototype.apply = function (args, reciever) {
        var val = this.fn.apply(reciever|| this, args);
        return this.next ? this.next.apply(makeArray(val), reciever || this) : val;        
    };
    Stack.prototype.clone = function (fn, next) {
        return new Stack(fn || this.fn, next || this.next);
    };
    Stack.prototype.tail = function () {
        var current = this;
        while(current.next) {
            current = current.next;
        }
        return current;
    };
    Stack.prototype.penultimate = function (fn) {
        var current = this
        var previous;
        while (fn ? current.next && current.fn !== fn : current.next) {
            previous = current;
            current = current.next;
        }
        return previous;
    };
    Stack.prototype.unshift = function (fn) {
        return this.tail().insert(fn);
    };
    Stack.prototype.after = function (match, fn) {
        var p = this.penultimate(match || undef);
        return p ? p.next.insert(fn) : this;
    };
    Stack.prototype.shift = function () {
        var p = this.penultimate();
        var removed = p.next;
        p.next = undef;
        return removed;
    };
    Stack.prototype.pop = function () {
        this.next = undef;
        return this;
    };
    global.Stack = Stack;
}(this));
