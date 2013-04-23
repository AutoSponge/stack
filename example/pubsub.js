(function (namespace) {
    var topics = {};
    var idSeed = 0;
    function getTopic(key) {
        return topics[key];
    }
    function isStack(stack) {
        return stack instanceof Stack;
    }
    function derivatives(topic) {
        return topic.split("/").map(function (e, i, arr) {
            var copy = arr.slice(0);
            return i === 0 ? topic : (copy.splice(i, 1, "*"), copy.join("/"));
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
        this.id = !id ? idSeed++ : id;
        PubSub.index[this.id] = this;
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
        var head = topics[topic].priorFn(fn);
        if (head && head.next) {
            head.next = head.next.next;
        }
        return this;
    };
    PubSub.prototype.publish = function (topic, data, context) {
        getStacks(topic).forEach(function (stack) {
            stack.call(data, context);
        });
    };

    namespace.PubSub = PubSub;
}(this));

var pubsub = new PubSub();
pubsub.subscribe("log/*/test", function (data) {
    console.log("heard", data)
});
pubsub.subscribe("log/first/test", function (data) {
    console.log("first", data)
});
pubsub.publish("log/first/test", 1); //first 1, heard 1
pubsub.publish("log/second/test", 2); //heard 2
function second(data) {
    console.log("second", data);
}
pubsub.subscribe("log/second/test", second);
pubsub.publish("log/second/test", 3); //second 3, heard 3
pubsub.unsubscribe("log/second/test", second);
pubsub.publish("log/second/test", 4); //heard 4
