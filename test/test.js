test("Test", function() {
    function a(val) {
        return "a" + val;
    }
    function b(val) {
        return "b" + val;
    }
    function c(val) {
        return "c" + val;
    }
    expect(6);
    ok(Stack(a).call(1) === "a1");
    ok(Stack(a).push(b).call(1) === "ab1");
    ok(Stack(a).push(b).push(c).call(1) === "abc1");
    ok(Stack([c,b,a]).call(1) === "abc1");
    var stack = Stack(c);
    stack.add(b).add(a);
    ok(stack.call(1) === "abc1");
    ok(Stack(c).addAll([b,a]).call(1) === "abc1");
});