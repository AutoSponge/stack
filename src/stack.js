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
    function each(obj, fn, reciever) {
        var i, len;
        var arr = typeof obj === "string" ? obj.split("") : obj;
        for (i = 0, len = arr.length; i < len; i += 1) {
            fn.call(reciever || arr, arr[i], i, arr);
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
        each(arr, function (fn) {
            prev = prev.unshift(fn);
        });
        return this;
    };
    Stack.prototype.index = function (idx) {
        return !idx ? this : this.next && this.next.index(idx - 1);
    };
    Stack.prototype.priorNext = function (stack) {
        return this.next && this.next.next === stack ? this : this.next && this.next.priorNext(stack);
    };
    Stack.prototype.priorFn = function (fn) {
        return (this.next && this.next.fn === fn) ? this : this.next && this.next.priorFn(fn);
    };
    Stack.prototype.searchNext = function (stack) {
        var p;
        if (this.next === stack) {
            return this;
        }
        p = this.priorNext(stack);
        return p && p.next;

    };
    Stack.prototype.searchFn = function (fn) {
        var p;
        if (this.fn === fn) {
            return this;
        }
        p = this.priorFn(fn);
        return p && p.next;
    };
    Stack.prototype.distribute = function (arg, reciever) {
        this.fn.call(reciever || this, arg);
        return this.next ? this.next.distribute(arg, reciever || this) : arg;
    };
    Stack.prototype.distributeAll = function (args, reciever) {
        this.fn.apply(reciever|| this, args);
        return this.next ? this.next.distributeAll(makeArray(args), reciever || this) : args;        
    };
    Stack.prototype.call = function (arg, reciever) {
        var val = this.fn.call(reciever || this, arg);
        return this.next && val !== false ? this.next.call(val, reciever || this) : val;
    };
    Stack.prototype.apply = function (args, reciever) {
        var val = this.fn.apply(reciever|| this, args);
        return this.next && val !== false ? this.next.apply(makeArray(val), reciever || this) : val;        
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
    Stack.prototype.unshift = function (fn) {
        return this.tail().insert(fn);
    };
    Stack.prototype.after = function (match, fn) {
        var p = this.priorNext(match || undef);
        return p ? p.next.insert(fn) : this;
    };
    Stack.prototype.shift = function () {
        var p = this.priorNext();
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
