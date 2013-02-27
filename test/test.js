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
*/
