module("Given");
test("test given > when > then", function () {
    var success = null
        count = 0;
    Feature("my requirement")
        .given(function isOdd(data) {
            return data%2 === 1;
        })
        .and(function (data) {
            return typeof data === "number";
        })
        .when("my requirement/run")
        .then(function () {
            success = true;
            count += 1;
        })
        .unless(function () {
            return success !== null;
        })
        .or(function (data) {
            return data === 3;
        })
        .until("my requirement/stop");

    var test = Feature.publish("my requirement/run");
    test(1);
    ok(success === true);
    ok(count === 1);
    test(1);
    ok(count === 1);
    success = null;
    test(2);
    ok(success === null);
    ok(count === 1);
    test(3);
    ok(success === null);
    ok(count === 1);
    test(5);
    ok(success === true);
    ok(count === 2);
    success = null;
    Feature.publish("my requirement/stop")();
    test(1);
    ok(success === null);
    ok(count === 2);
});