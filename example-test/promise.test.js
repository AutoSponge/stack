module("Promise");
asyncTest("promises", function () {
    expect(6);
    var status = null;
    function reset(promise) {
        status = null;
        promise.state = new Promise().state;
    }

    var p1 = Promise(function () {
        status = "done";
    }, function () {
        status = "fail";
    });

    p1.when(true);
    ok(status === "done");
    reset(p1);

    p1.when(false);
    reset(p1);
    ok(status === "fail");

    p1.when(function () {
        return true;
    });
    ok(status === "done");
    reset(p1);

    var p2 = Promise();
    var p3 = Promise(function (data) {
        if (data === "finish") {
            p2.resolve()
        } else {
            status = "miss";
        }
    });
    p1.when(p2, p3);
    ok(status === "miss");
    p3.resolveWith(null, "finish");
    ok(status === "done");
    reset(p1);

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