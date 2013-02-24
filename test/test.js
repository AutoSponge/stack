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
