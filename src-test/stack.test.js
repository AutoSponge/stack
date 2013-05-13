test("Stack constructor", function () {
    expect(8);
    var stack = new Stack();
    ok(stack instanceof Stack);
    ok(typeof stack.fn === "function");
    ok(typeof stack.next === "undefined");
    stack = Stack();
    ok(stack instanceof Stack);
    function bang(val) {
        return val + "!";
    }
    ok(Stack(bang).fn === bang);
    function greet(name) {
        return "Hi, " + name;
    }
    ok(Stack(greet, Stack(bang)).call("Dave") === "Hi, Dave!");
    function addO(name) {
        return name + "-O";
    }
    ok(Stack([bang, addO, greet]).call("Dave") === "Hi, Dave-O!");
    var greetStack = Stack([bang, addO, greet]);
    function openEmote(val) {
        return val + "/*";
    }
    function closeEmote(val) {
        return val + "*/";
    }
    function highFive(val) {
        return val + "gives a high five";
    }
    ok(Stack([closeEmote, highFive, openEmote, greetStack]).call("Dave") === "Hi, Dave-O!/*gives a high five*/");
});
test("call", function () {
    expect(3);
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    var stackA = new Stack(a);
    var stackB = new Stack(b, stackA);
    var stackC = new Stack(c, stackB);
    ok(stackC.call(1) === "abc1");
    function decide(val) {
        return val === "c1" ? Stack(a) : Stack(b);
    }
    var stack = Stack([decide,c]);
    ok(stack.call(1) === "ac1");
    ok(stack.call(0) === "bc0");
});
test("push a function", function() {
    expect(6);
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    ok(Stack(a).call(1) === "a1");
    ok(Stack(a).push(b).call(1) === "ab1");
    ok(Stack(a).push(b).push(c).call(1) === "abc1");
    function sumA(data) {
        return this.a + data;
    }
    function sumB(data) {
        return this.b + data;
    }
    function sumC(data) {
        return this.c + data;
    }
    var obj = {a: "a", b: "b", c: "c"};
    ok(Stack(sumA).call(1, obj) === "a1");
    ok(Stack(sumA).push(sumB).call(1, obj) === "ab1");
    ok(Stack(sumA).push(sumB).push(sumC).call(1, obj) === "abc1");
});
test("push a stack", function() {
    expect(7);
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    var stackB = Stack(b);
    var stackC = Stack(c);
    ok(Stack(a).call(1) === "a1");
    ok(Stack(a).push(Stack(b)).call(1) === "ab1");
    ok(Stack(a).push(stackB).push(stackC).call(1) === "abc1");
    function sumA(data) {
        return this.a + data;
    }
    function sumB(data) {
        return this.b + data;
    }
    function sumC(data) {
        return this.c + data;
    }
    var obj = {a: "a", b: "b", c: "c"};
    stackB = Stack(sumB);
    stackC = Stack(sumC);
    ok(Stack(sumA).call(1, obj) === "a1");
    ok(Stack(sumA).push(Stack(sumB)).call(1, obj) === "ab1");
    ok(Stack(sumA).push(stackB).push(stackC).call(1, obj) === "abc1");
    ok(Stack(sumA).push(Stack([a,b,c])).call(1, obj) === "aabc1");
});
test("apply", function() {
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
    expect(5);
    ok(Stack(sum).push(flatten).apply([[1],[2],[3]]) === 6);
    ok(Stack([sum, doubleAll, flatten]).apply([[1],[2],[3]]) === 12);
    function sumThis() {
        var args = Array.prototype.slice.call(arguments, 0);
        var self = this;
        return args.reduce(function(a, b) {
            return a + b + self.seed;
        });
    }
    var obj = {seed: 1};
    ok(Stack([sumThis, doubleAll, flatten]).apply([[1],[2],[3]], obj) === 14);
    function decide(args, obj) {
        return arguments.length > 2 ? Stack(doubleAll, Stack(sumThis)) : [args, obj];
    }
    ok(Stack([sumThis, decide, flatten]).apply([[1],[2],[3]], obj) === 14);
    ok(Stack([sumThis, decide, flatten]).apply([[1],[2]], obj) === 4);
});
test("insert can stack a function", function () {
    function a(data) {
        return "a" + data;
    }
    function b(data) {
        return "b" + data;
    }
    function c(data) {
        return "c" + data;
    }
    var stack = Stack([a,c]);
    expect(3);
    ok(stack.call(1) === "ac1");
    ok(stack.insert(b).call(1) === "ab1");
    ok(stack.call(1) === "abc1");
});
test("tail", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    expect(1);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    ok(stack2.tail() === stack1);
});
test("superPrecedes", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    function fn4() {return 4;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    var stack4 = stack3.push(fn4);
    expect(5);
    ok(stack3.superPrecedent() === stack2);
    ok(stack4.superPrecedent() === stack2);
    ok(stack4.superPrecedent(stack1) === stack3);
    ok(typeof stack3.superPrecedent(stack3) === "undefined");
    ok(typeof stack1.superPrecedent() === "undefined");
});
test("composedWith", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    function fn4() {return 4;}
    expect(5);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    var stack4 = stack3.push(fn4);
    ok(stack4.composedWith(fn1) === stack2);
    ok(stack4.composedWith(fn2) === stack3);
    ok(stack4.composedWith(fn3) === stack4);
    ok(typeof stack4.composedWith(fn4) === "undefined");
    ok(typeof stack4.composedWith() === "undefined");
});
test("using", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    expect(5);
    ok(stack3.using(fn3) === stack3);
    ok(stack3.using(fn2) === stack2);
    ok(stack3.using(fn1) === stack1);
    ok(typeof stack1.using(fn3) === "undefined");
    ok(typeof stack1.using() === "undefined");
});
test("precedent", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    expect(5);
    ok(typeof stack3.precedent(stack3) === "undefined");
    ok(stack3.precedent(stack2) === stack3);
    ok(stack3.precedent(stack1) === stack2);
    ok(stack3.precedent() === stack1);
    ok(typeof stack2.precedent(stack3) === "undefined");
});
test("precedes", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    expect(4);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    ok(stack3.precedes(stack2) === true);
    ok(stack3.precedes(stack1) === false);
    ok(stack1.precedes() === true);
    ok(stack2.precedes() === false);
});
test("uses", function () {
    function fn1() {return 1;}
    expect(2);
    var stack1 = Stack(fn1);
    ok(stack1.uses(fn1) === true);
    ok(stack1.uses(function () {}) === false);
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
    expect(5);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    ok(stack1.call() === 1);
    var removed = stack3.pop();
    ok(stack3 === removed);
    ok(removed.call() === 3);
    ok(typeof stack3.next === "undefined");
    ok(stack2.call() === 1);
});
test("unshift", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack = Stack(fn1).push(fn2);
    expect(2);
    ok(typeof stack.unshift(fn3).next === "undefined");
    ok(stack.call() === 3);
});
test("index", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    expect(4);
    ok(stack3.index(2) === stack1);
    ok(stack3.index(1) === stack2);
    ok(stack3.index(0) === stack3);
    ok(typeof stack1.index(1) === "undefined");
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
    expect(13);
    ok(typeof stack.distribute(1) === "undefined");
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
    function decide(val) {
        return val === 0 ? Stack(b) : val;
    }
    stack = Stack([a, decide, c]);
    aVal = 0;
    bVal = 0;
    cVal = 0;
    stack.distribute(1, {bonus: 1});
    ok(aVal === 2);
    ok(bVal === 0);
    ok(cVal === 4);
    stack.distribute(0);
    ok(aVal = 2);
    ok(bVal = 1);
    ok(cVal = 2);
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
    expect(10);
    ok(typeof stack.distributeAll([1, 2, 3]) === "undefined");
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
    function decide() {
        return this.bonus === 1 ? Stack(a) : Stack(b);
    }
    aVal = 0;
    bVal = 0;
    cVal = 0;
    stack = Stack([decide, c]);
    stack.distributeAll([1, 2, 3], {bonus: 0});
    ok(aVal === 0);
    ok(bVal === 3);
    ok(cVal === 5);
});
test("before", function () {
    function a(data) {
        return "a" + data;
    }
    function b(data) {
        return "b" + data;
    }
    function c(data) {
        return "c" + data;
    }
    var stack = Stack();
    stack.before(null, a);
    stack.before(a, c);
    stack.before(a, b);
    stack.before(b, null);
    expect(1);
    ok(stack.call(1) === "cba1");
});
test("some", function () {
    var falsecount = 0;
    function truthy() {
        return true;
    }
    function falsey() {
        falsecount += 1;
        return false;
    }
    var allfalse = Stack([falsey, falsey, falsey]);
    var onetrue = Stack([falsey, truthy, falsey]);
    expect(8);
    ok(allfalse.some() === false);
    ok(falsecount = 3);
    falsecount = 0;
    ok(onetrue.some() === true);
    ok(falsecount = 1);
    function isOne(data) {
        return data === 1;
    }
    function isTwo(data) {
        return data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    allfalse = Stack([isOne, isTwo, isOdd]);
    ok(allfalse.some(0) === false);
    onetrue = Stack([isOne, isTwo, isOdd]);
    ok(onetrue.some(2) === true);
    function isTest(data) {
        return data === this.test;
    }
    var obj = {test: 1};  //todo
    allfalse = Stack([isTest, isTwo, isOdd]);
    ok(allfalse.some(0) === false);
    ok(allfalse.some(1) === true);
    //todo branching
});
test("every", function () {
    var truecount = 0;
    function truthy() {
        truecount += 1;
        return true;
    }
    function falsey() {
        return false;
    }
    var alltrue = Stack([truthy, truthy, truthy]);
    var onefalse = Stack([truthy, falsey, truthy]);
    expect(8);
    ok(alltrue.every() === true);
    ok(truecount = 3);
    truecount = 0;
    ok(onefalse.every() === false);
    ok(truecount = 1);
    function isOne(data) {
        return data === 1;
    }
    function isTwo(data) {
        return data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    alltrue = Stack([isOne, isOdd]);
    ok(alltrue.every(1) === true);
    onefalse = Stack([isOne, isTwo, isOdd]);
    ok(onefalse.every(1) === false);
    function isTest(data) {
        return data === this.test;
    }
    var obj = {test: 1};
    alltrue = Stack([isOne, isOdd, isTest]);
    ok(alltrue.every(1, obj) === true);
    obj.test = 2;
    ok(alltrue.every(1, obj) === false);
    //todo branching
});