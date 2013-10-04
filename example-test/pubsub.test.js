if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                    ? this
                    : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        return fBound;
    };
}

module("PubSub");
test("test PubSub has the correct api", function () {
    expect(5);
    ok(typeof PubSub === "object");
    ok(typeof PubSub.subscribe === "function");
    ok(typeof PubSub.publish === "function");
    ok(typeof PubSub.unsubscribe === "function");
    ok(typeof PubSub.installTo === "function");
});
test("test PubSub can subscribe to a topic", function () {
    var heard = null;
    PubSub.subscribe("test", function () {
        heard = true;
    });
    PubSub.publish("test")();
    ok(heard === true);
});
test("test PubSub can subscribe to a wildcard topic", function () {
    var heard = null;
    PubSub.subscribe("test/*", function () {
        heard = true;
    });
    PubSub.publish("test/a")();
    ok(heard === true);
});
test("test PubSub can pass arguments to subscribers", function () {
    var heard = null;
    PubSub.subscribe("test/args", function () {
        heard = arguments;
    });
    PubSub.publish("test/args")(1,2,3);
    ok(heard.length === 3);
});
test("test PubSub can bind a handler to a receiver", function () {
    var heard = {
        called: 0
    };
    PubSub.subscribe("test/bind", function () {
        this.called += 1;
    }, heard);
    PubSub.publish("test/bind")();
    ok(heard.called === 1);
});
test("test PubSub can unsubscribe", function () {
    var heard = null;
    var sub = PubSub.subscribe("test", function () {
        heard = true;
    });
    PubSub.unsubscribe("test", sub);
    PubSub.publish("test")();
    ok(heard === null);
});