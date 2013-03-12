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
test("penultimate", function () {
    function fn1() {return 1;}
    function fn2() {return 2;}
    function fn3() {return 3;}
    function fn4() {return 4;}
    expect(3);
    var stack1 = Stack(fn1);
    var stack2 = stack1.push(fn2);
    var stack3 = stack2.push(fn3);
    var stack4 = stack3.push(fn4);
    ok(stack3.penultimate() === stack2);
    ok(stack4.penultimate() === stack2);
    ok(stack4.penultimate(fn2) === stack3);
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
/*
(function (namespace) {
    var topics = {};
    function getTopic(key) {
        return topics[key];
    }
    function isStack(stack) {
        return stack instanceof Stack;
    }
    function derivatives(topic) {
        return str.split("/").map(function (e, i, arr) {
            var copy = arr.slice(0);
            return i === 0 ? str : (copy.splice(i, 1, "*"), copy.join("/"));
        });
    }
    function getStacks(topic) {
        return derivatives(topic).map(getTopic).filter(isStack);
    }
    function PubSub(id) {
        if (!(this instanceof PubSub)) {
            return new PubSub(id);
        }
        if (!PubSub.index) {
            PubSub.index = {};
        }
        PubSub.index[id] = this;
        this.id = id;
    }
    PubSub.prototype.subscribe = function (topic, fn) {
        var stack = topics[topic];
        if (!stack) {
            topics[topic] = new Stack(fn);
        } else {
            stack.push(fn);
        }
        return this;
    };
    PubSub.prototype.unsubscribe = function (topic, fn) {
        var stack = topics[topic];
        
        return this;
    };
    PubSub.prototype.publish = function (topic, data, context) {
        getStacks(topic).forEach(function (stack) {
            stack.call(context, data);
        });
    };
    
    namespace.PubSub = PubSub;
}(this));

///////
(function (namespace) {
    var topics = {};
    PubSub = {
        subscribe: function (topic, fn, reciever) {
            var arr = topics[topic] = topics[topic] || [];
            arr.push({
                fn: fn,
                reciever: reciever
            });
            return this;
        },
        publish: function (topic, data) {
            (topics[topic] || []).forEach(function (obj) {
                obj.fn.call(obj.reciever, data || {});
            })
        }
    }   
    namespace.PubSub = PubSub;
}(this));

function Given(fn) {
    if (!(this instanceof Given)) {
        return new Given(fn);
    }
    this.head = this.tail = new Stack(fn);
};
Given.prototype.and = function (fn) {
    this.head = this.head.push(fn);
    return this;
};
Given.prototype.when = function (topic) {
    PubSub.subscribe(topic, this.fire, this);
    return this;
};
Given.prototype.fire = function (data) {
    return this.head.call(data);
};
Given.prototype.then = function (fn) {
    this.tail = this.tail.insert(fn);
    return this;
};

Given(function (data) {
        console.log(data);
        return data === 1;
    })
    .when("test")
    .then(function () {console.log("success");});
    
PubSub.publish("test", 1);


*/
