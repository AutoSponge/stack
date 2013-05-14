test("Stack is a function", function () {
    ok(typeof Stack === "function");
});
test("Stack is a constructor", function () {
    var stack = new Stack();
    ok(stack instanceof Stack);
});
test("Stack will instantiate without the 'new' keyword", function () {
    var stack = Stack();
    ok(stack instanceof Stack);
});
test("Stack has the correct static methods", function () {
    expect(2);
    ok(typeof Stack.create === "function");
    ok(typeof Stack.alias === "function");
});
test("create can take a function and return a stack", function () {
    ok(Stack.create(function () {}) instanceof Stack);
});
test("create can take a stack and return a stack", function () {
    var stack = Stack();
    ok(Stack.create(stack) === stack);
});
test("alias creates another reference on the prototype", function () {
    var stack = Stack();
    ok(stack.from === stack.push);
});
test("instances of stack can be identified", function () {
    var stack = new Stack();
    ok(stack.isStack === true);
});
test("instances of Stack have the correct api", function () {
    expect(24);
    var stack = new Stack();
    ok(typeof stack.clone === "function");
    ok(typeof stack.push === "function");
    ok(typeof stack.pop === "function");
    ok(typeof stack.shift === "function");
    ok(typeof stack.unshift === "function");
    ok(typeof stack.insert === "function");
    ok(typeof stack.before === "function");
    ok(typeof stack.index === "function");
    ok(typeof stack.uses === "function");
    ok(typeof stack.using === "function");
    ok(typeof stack.composedWith === "function");
    ok(typeof stack.precedes === "function");
    ok(typeof stack.precedent === "function");
    ok(typeof stack.superPrecedent === "function");
    ok(typeof stack.distribute === "function");
    ok(typeof stack.distributeAll === "function");
    ok(typeof stack.call === "function");
    ok(typeof stack.apply === "function");
    ok(typeof stack.some === "function");
    ok(typeof stack.every === "function");
    ok(typeof stack.from === "function");
    ok(typeof stack.to === "function");
    ok(typeof stack.compose === "function");
    ok(typeof stack.tail === "function");
});
test("instances of Stack have fn and next properties", function () {
    expect(2);
    var stack = new Stack();
    ok(stack.hasOwnProperty("fn"));
    ok(stack.hasOwnProperty("next"));
});
test("Stack assigns 'identity' to fn property by default", function () {
    var stack = new Stack();
    ok(typeof stack.fn === "function");
});
test("identity function returns the first argument when there is only one", function () {
    var stack = new Stack();
    ok(stack.fn.call(null, 1) === 1);
});
test("identity function returns the arguments when there are more than one", function () {
    var stack = new Stack();
    var args = stack.fn.call(null, 1, 2, 3);
    ok(args[0] === 1);
});
test("Stack assigns undefined to next by default", function () {
    var stack = new Stack();
    ok(typeof stack.next === "undefined");
});
test("Stack assigns a function parameter to the fn property", function () {
    function bang(val) {
        return val + "!";
    }
    ok(Stack(bang).fn === bang);
});
test("Stack assigns a stack to next for the second parameter", function () {
    function bang(val) {
        return val + "!";
    }
    function greet(name) {
        return "Hi, " + name;
    }
    var stackBang = Stack(bang);
    ok(Stack(greet, stackBang).next === stackBang);
});
test("Stack can create a stack from an array of functions", function () {
    expect(3);
    function bang(val) {
        return val + "!";
    }
    function greet(name) {
        return "Hi, " + name;
    }
    function addO(name) {
        return name + "-O";
    }
    var stack = Stack([bang, addO, greet]);
    ok(stack.fn === greet);
    ok(stack.next.fn === addO);
    ok(stack.next.next.fn === bang);
});
test("Stack can create a stack from an array of functions and stacks", function () {
    expect(3);
    function bang(val) {
        return val + "!";
    }
    function greet(name) {
        return "Hi, " + name;
    }
    function addO(name) {
        return name + "-O";
    }
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
    var stack = Stack([closeEmote, highFive, openEmote, greetStack]);
    ok(stack === greetStack);
    ok(stack.tail().fn === closeEmote);
    ok(stack.superPrecedent().fn === highFive);
});
test("call can compose a stack", function () {
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
});
test("call can follow a stack returned by a stack.fn", function () {
    expect(2);
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    function decide(val) {
        return val === "c1" ? Stack(a) : Stack(b);
    }
    var stack = Stack([decide,c]);
    ok(stack.call(1) === "ac1");
    ok(stack.call(0) === "bc0");
});
test("call can take a receiver object", function () {
    expect(3);
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
test("call will not overflow the stack", function () {
    function add1(val) {
        return val + 1;
    }
    function stringVal(val) {
        return "value is " + val;
    }
    var stack = Stack(add1);
    function decideAdd(val) {
        return val > 5000 ? Stack(stringVal) : stack;
    }
    stack.insert(decideAdd);
    ok("recursive decisions should not overflow", stack.call(0) === "value is 5001");
});
test("push of a function creates a new head", function() {
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
    ok(Stack(a).call(1) === "a1");
    ok(Stack(a).push(b).call(1) === "ab1");
    ok(Stack(a).push(b).push(c).call(1) === "abc1");
});
test("push of a stack creates a new head from the stack head", function() {
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
    var obj = {a: "x", b: "y", c: "z"};
    stackB = Stack(sumB);
    stackC = Stack(sumC);
    ok(Stack(sumA).call(1, obj) === "x1");
    ok(Stack(sumA).push(Stack(sumB)).call(1, obj) === "xy1");
    ok(Stack(sumA).push(stackB).push(stackC).call(1, obj) === "xyz1");
    ok(Stack(sumA).push(Stack([a,b,c])).call(1, obj) === "xabc1");
});
test("apply takes an array of parameters which pass to fn as arguments", function() {
    expect(2);
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
    ok(Stack(sum).push(flatten).apply([[1],[2],[3]]) === 6);
    ok(Stack([sum, doubleAll, flatten]).apply([[1],[2],[3]]) === 12);
});
test("apply takes a receiver object as the second parameter", function () {
    expect(3);
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
    expect(3);
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
    ok(stack.call(1) === "ac1");
    ok(stack.insert(b).call(1) === "ab1");
    ok(stack.call(1) === "abc1");
});
test("tail returns the last stack, the stack with no next", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    ok(stack2.tail() === stack1);
});
test("superPrecedes returns the stack prior to the stack with no next", function () {
    expect(5);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    function fn4() {return 4;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    var stack4 = stack3.push(fn4);
    ok(stack3.superPrecedent() === stack2);
    ok(stack4.superPrecedent() === stack2);
    ok(stack4.superPrecedent(stack1) === stack3);
    ok(typeof stack3.superPrecedent(stack3) === "undefined");
    ok(typeof stack1.superPrecedent() === "undefined");
});
test("composedWith returns the stack prior to the stack with the provided function as fn", function () {
    expect(5);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    function fn4() {return 4;}
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
test("using returns the stack using the provided function as fn", function () {
    expect(5);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    ok(stack3.using(fn3) === stack3);
    ok(stack3.using(fn2) === stack2);
    ok(stack3.using(fn1) === stack1);
    ok(typeof stack1.using(fn3) === "undefined");
    ok(typeof stack1.using() === "undefined");
});
test("precedent returns the stack prior to the provided stack", function () {
    expect(5);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    ok(typeof stack3.precedent(stack3) === "undefined");
    ok(stack3.precedent(stack2) === stack3);
    ok(stack3.precedent(stack1) === stack2);
    ok(stack3.precedent() === stack1);
    ok(typeof stack2.precedent(stack3) === "undefined");
});
test("precedes returns true if the stack has a next of the parameter stack", function () {
    expect(4);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    ok(stack3.precedes(stack2) === true);
    ok(stack3.precedes(stack1) === false);
    ok(stack1.precedes() === true);
    ok(stack2.precedes() === false);
});
test("uses returns true if the stack has a fn of the provided function", function () {
    expect(2);
    function fn1() {return 1;}
    var stack1 = Stack(fn1);
    ok(stack1.uses(fn1) === true);
    ok(stack1.uses(function () {}) === false);
});
test("shift removes the tail and returns it", function () {
    expect(3);
    function fn1() {return 1;}
    function fn2() {return 2;}
    var stack = Stack(fn1).push(fn2);
    ok(stack.call() === 1);
    var removed = stack.shift();
    ok(stack.call() === 2);
    ok(removed.call() === 1);
});
test("pop removes the head and returns it", function () {
    expect(5);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
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
test("unshift places a new stack at the tail", function () {
    expect(2);
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    var stack = Stack(fn1).push(fn2);
    ok(typeof stack.unshift(fn3).next === "undefined");
    ok(stack.call() === 3);
});
test("index returns the stack of n stack depth", function () {
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
test("clone copies the stacks properties for a new instance", function () {
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
    function d(val) {
        return "d" + val;
    }
    var stack = Stack([a, b, c]);
    var clone = stack.clone();
    ok(stack.call(1) === clone.call(1));
    clone = stack.clone(d);
    ok(clone.call(1) === "abd1");
    clone = stack.clone(null, Stack(d));
    ok(clone.call(1) === "dc1");
});
test("distribute provides the given argument to all stacks", function () {
    expect(6);
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
    function decide(val) {
        return val === 0 ? Stack(b) : val;
    }
    var stack = Stack([a, decide, c]);
    stack.distribute(1, {bonus: 1});
    ok(aVal === 2);
    ok(bVal === 0);
    ok(cVal === 4);
    stack.distribute(0);
    ok(aVal = 2);
    ok(bVal = 1);
    ok(cVal = 2);
});
test("distribute can take a receiver object", function () {
    expect(7);
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
});
test("distribute will follow a returned stack", function () {
    expect(7);
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
    function decide(val) {
        return val === 0 ? Stack(b) : val;
    }
    var stack = Stack([a, decide, c]);
    ok(typeof stack.distribute(1) === "undefined");
    ok(aVal === 1);
    ok(bVal === 0);
    ok(cVal === 3);
    stack.distribute(0, {bonus: 1});
    ok(aVal === 1);
    ok(bVal === 2);
    ok(cVal === 6);
});
test("distributeAll provides the given arguments list to all stacks", function () {
    expect(4);
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
    ok(typeof stack.distributeAll([1, 2, 3]) === "undefined");
    ok(aVal === 1);
    ok(bVal === 3);
    ok(cVal === 5);
});
test("distributeAll can take a receiver object", function () {
    expect(4);
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
    ok(typeof stack.distributeAll([1, 2, 3], {bonus: 1}) === "undefined");
    ok(aVal === 2);
    ok(bVal === 4);
    ok(cVal === 6);
});
test("distributeAll will follow a returned stack", function () {
    expect(3);
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
    function decide() {
        return this.bonus === 1 ? Stack(a) : Stack(b);
    }
    var stack = Stack([decide, c]);
    stack.distributeAll([1, 2, 3], {bonus: 0});
    ok(aVal === 0);
    ok(bVal === 3);
    ok(cVal === 5);
});
test("before inserts a stack before the given stack", function () {
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
test("some distributes until a stack fn returns true", function () {
    expect(4);
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
    ok(allfalse.some() === false);
    ok(falsecount = 3);
    falsecount = 0;
    ok(onetrue.some() === true);
    ok(falsecount = 1);
});
test("some can take an argument", function () {
    expect(2);
    function isOne(data) {
        return data === 1;
    }
    function isTwo(data) {
        return data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    var allfalse = Stack([isOne, isTwo, isOdd]);
    ok(allfalse.some(0) === false);
    var onetrue = Stack([isOne, isTwo, isOdd]);
    ok(onetrue.some(2) === true);
});
test("some can take a receiver object", function () {
    expect(2);
    function isTest(data) {
        return data === this.test;
    }
    function isTwo(data) {
        return data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    var obj = {test: 1};
    var stack = Stack([isTest, isTwo, isOdd]);
    ok(stack.some(0, obj) === false);
    ok(stack.some(2, obj) === true);
});
test("some can follow a returned stack", function () {
    expect(5);
    var wasZero = false;
    function foundZero() {
        wasZero = true;
    }
    function isOne(data) {
        return data === 1;
    }
    function isTwo(data) {
        return data === 0 ? Stack(foundZero, this.next) : data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    var stack = Stack([isOne, isTwo, isOdd]);
    ok(wasZero === false);
    ok(stack.some(4) === false);
    ok(wasZero === false);
    ok(stack.some(0) === false);
    ok(wasZero === true);
});
test("every distributes until a stack fn returns false", function () {
    expect(4);
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
    ok(alltrue.every() === true);
    ok(truecount = 3);
    truecount = 0;
    ok(onefalse.every() === false);
    ok(truecount = 1);
});
test("every can take an argument", function () {
    expect(2);
    function isOne(data) {
        return data === 1;
    }
    function isTwo(data) {
        return data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    var alltrue = Stack([isOne, isOdd]);
    ok(alltrue.every(1) === true);
    var onefalse = Stack([isOne, isTwo, isOdd]);
    ok(onefalse.every(1) === false);
});
test("every can take a receiver object", function () {
    expect(2);
    function isOne(data) {
        return data === 1;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    function isTest(data) {
        return data === this.test;
    }
    var obj = {test: 1};
    alltrue = Stack([isOne, isOdd, isTest]);
    ok(alltrue.every(1, obj) === true);
    obj.test = 2;
    ok(alltrue.every(1, obj) === false);
});
test("every can follow a returned stack", function () {
    expect(5);
    var wasOne = false;
    function foundOne() {
        wasOne = true;
    }
    function isOne(data) {
        return data === 1;
    }
    function isTwo(data) {
        return data === 1 ? Stack(foundOne, this.next) : data === 2;
    }
    function isOdd(data) {
        return data%2 === 1;
    }
    var stack = Stack([isOne, isTwo, isOdd]);
    ok(wasOne === false);
    ok(stack.every(0) === false);
    ok(wasOne === false);
    ok(stack.every(1) === true);
    ok(wasOne === true);
});
test("iterators can return a continuation", function () {
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    function pause() {
        return this.pause();
    }
    var stack = Stack([a,b,pause,c]);
    var cont = stack.call(1);
    ok(cont.isContinuation === true);
});
test("continuations can be run to completion", function () {
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    function pause() {
        return this.pause();
    }
    var stack = Stack([a,b,pause,c]);
    var cont = stack.call(1);
    ok(cont.run() === "abc1");
});
test("continuations can return current value", function () {
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    function pause() {
        return this.pause();
    }
    var stack = Stack([a,b,pause,c]);
    var cont = stack.call(1);
    ok(cont.value() === "c1");
});