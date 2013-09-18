(function (global) {
    var resolved = "resolved";
    var rejected = "rejected";
    var unresolved = "pending";
    var slice = Array.prototype.slice;
    function Promise(done, fail) {
        if (!(this instanceof Promise)) {
            return new Promise(done, fail);
        }
        this.state = unresolved;
        this.resolveStack = Stack(done);
        this.rejectStack = Stack(fail);
    }
    Promise.prototype.resolve = function () {
        if (this.state === unresolved) {
            this.state = resolved;
            this.resolveStack.spread(arguments);
        }
        return this;
    };
    Promise.prototype.resolveWith = function (receiver) {
        if (this.state === unresolved) {
            this.state = resolved;
            this.resolveStack.spread(slice.call(arguments, 1), receiver);
        }
        return this;
    };
    Promise.prototype.isResolved = function () {
        return this.state === resolved;
    };
    Promise.prototype.reject = function () {
        if (this.state === unresolved) {
            this.state = rejected;
            this.rejectStack.spread(arguments);
        }
        return this;
    };
    Promise.prototype.rejectWith = function (receiver) {
        if (this.state === unresolved) {
            this.state = rejected;
            this.rejectStack.spread(slice.call(arguments, 1), receiver);
        }
        return this;
    };
    Promise.prototype.isRejected = function () {
        return this.state === rejected;
    };
    Promise.prototype.isComplete = function () {
        return this.state !== unresolved;
    };
    Promise.prototype.then = function (done, fail) {
        return this.done(done).fail(fail);
    };
    Promise.prototype.done = function (fn) {
        this.resolveStack.insert(fn);
        return this;
    };
    Promise.prototype.fail = function (fn) {
        this.rejectStack.insert(fn);
        return this;
    };
    Promise.prototype.inspect = function () {
        return {state: this.state};
    };
    Promise.prototype.when = function () {
        var self = this;
        var pCount = 0;
        var pResolved = 0;
        var resolve = slice.call(arguments).every(function (f) {
            var p = f;
            if (!(p instanceof Promise)) {
                p = typeof f === "function" ? f() : f;
            }
            if (!(p instanceof Promise)) {
                if (p === false) {
                    self.reject();
                    return false;
                }
            } else {
                if (p.isRejected()) {
                    self.reject();
                    return false;
                }
                pCount += 1;
                p.done(function () {
                    if (!self.isComplete()) {
                        pResolved += 1;
                        if (pResolved === pCount) {
                            self.resolve();
                        }
                    }
                });
                p.fail(function () {
                    self.reject();
                });
            }
            return true;
        });
        if (!pCount) {
            this[resolve ? "resolve" : "reject"]();
        }
        return this;
    };
    global.Promise = Promise;
}(this));



