module("Promise");
asyncTest("promises", function () {
    start();
    var status = null;
    function reset(promise) {
        status = null;
        promise.state = "pending";
    }

    var p1 = Promise(function () {
        status = "done";
    }, function () {
        status = "fail";
    });

    p1.when(true);
    ok("promise of true value is resolved", status === "done");
    reset(p1);

    p1.when(false);
    ok("promise of false value is rejected", status === "fail");
    reset(p1);

    p1.when(function () {
        return true;
    });
    ok("promise of function is resolved because it evaluates to true", status === "done");
    reset(p1);

    stop();
    p1.when(function () {
        var p = new Promise();
        setTimeout(function () {
            p.resolve();
            ok(status === "done");
            start();
        }, 10);
        return p;
    });
});