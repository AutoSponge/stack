test("Test basic stack and push with call", function() {
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    expect(4);
    ok(Stack(a).call(1) === "a1");
    ok(Stack(a).push(b).call(1) === "ab1");
    ok(Stack(a).push(b).push(c).call(1) === "abc1");
    ok(Stack([a,b,c]).call(1) === "abc1");
});

test("Test basic stack and push with apply", function() {
    function flatten() {
        var args = Array.prototype.slice.call(arguments, 0);
    	return args.reduce(function(a, b) {
    		return a.concat(b);
    	});
    }
    function doubleAll() {
    	var args = Array.prototype.slice.call(arguments, 0);
    	return args.map(function(a) {
    		return a + a;
    	});
    }
    function sum() {
        var args = Array.prototype.slice.call(arguments, 0);
        return args.reduce(function(a, b) {
            return a + b;
        });
    }
    expect(2);
    ok(Stack(sum).push(flatten).apply([[1],[2],[3]]) === 6);
    ok(Stack([sum, doubleAll, flatten]).apply([[1],[2],[3]]) === 12);
});
test("tail", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    expect(1);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    ok(stack2.tail() === stack1);
});
test("priorNext", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    function fn4() {return 4;}
    expect(3);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    var stack4 = stack3.push(fn4);
    ok(stack3.priorNext() === stack2);
    ok(stack4.priorNext() === );
    ok(stack4.priorNext(stack2) === stack3);
});
test("shift", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    expect(3);
    var stack = Stack(fn1).push(fn2);
    ok(stack.call() === 1);
    var removed = stack.shift();
    ok(stack.call() === 2);
    ok(removed.call() === 1);
});
test("pop", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    expect(4);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    ok(stack1.call() === 1);
    var removed = stack3.pop();
    ok(stack3 === removed);
    ok(removed.call() === 3);
    ok(typeof stack3.next === "undefined");
});
test("unshift", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack = Stack(fn1).push(fn2);
    stack.unshift(fn3);
    expect(1);
    ok(stack.call() === 3);
});
test("index", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    expect(3);
    ok(stack3.index(2) === stack1);
    ok(stack3.index(1) === stack2);
    ok(stack3.index(0) === stack3);
});
test("search", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    expect(3);
    ok(stack3.search(fn3) === stack3);
    ok(stack3.search(fn2) === stack2);
    ok(stack3.search(fn1) === stack1);
});
test("clone", function () {
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    function d(val) {
        return "d" + val;
    }
    var stack = Stack([a, b, c]);
    expect(3);
    var clone = stack.clone();
    ok(stack.call(1) === clone.call(1));
    clone = stack.clone(d);
    ok(clone.call(1) === "abd1");
    clone = stack.clone(null, Stack(d));
    ok(clone.call(1) === "dc1");
});
test("distribute", function () {
    var aVal = 0;
    var bVal = 0;
    var cVal = 0;
    function a(val) {
        aVal += (val + (this.bonus || 0));
    }
    function b(val) {
        bVal += (val + 1 + (this.bonus || 0));
    }
    function c(val) {
        cVal += (val + 2 + (this.bonus || 0));
    }
    var stack = Stack([a, b, c]);
    stack.distribute(1);
    expect(6);
    ok(aVal === 1);
    ok(bVal === 2);
    ok(cVal === 3);
    aVal = 0;
    bVal = 0;
    cVal = 0;
    stack.distribute(1, {bonus: 1});
    ok(aVal === 2);
    ok(bVal === 3);
    ok(cVal === 4);
});
test("distributeAll", function () {
    var aVal = 0;
    var bVal = 0;
    var cVal = 0;
    function a(x, y, z) {
        aVal += (x + (this.bonus || 0));
    }
    function b(x, y, z) {
        bVal += (y + 1 + (this.bonus || 0));
    }
    function c(x, y, z) {
        cVal += (z + 2 + (this.bonus || 0));
    }
    var stack = Stack([a, b, c]);
    stack.distributeAll([1, 2, 3]);
    expect(6);
    ok(aVal === 1);
    ok(bVal === 3);
    ok(cVal === 5);
    aVal = 0;
    bVal = 0;
    cVal = 0;
    stack.distributeAll([1, 2, 3], {bonus: 1});
    ok(aVal === 2);
    ok(bVal === 4);
    ok(cVal === 6);
});
