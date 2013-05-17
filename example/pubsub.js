(function (namespace) {
    var topics = {};
    function getTopic(key) {
        return topics[key];
    }
    function isStack(stack) {
        return stack && stack.isStack;
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
    namespace.PubSub = {
        subscribe: function (topic, fn, receiver) {
            var f = receiver ? fn.bind(receiver) : fn;
            topics[topic] = topics[topic] && topics[topic].push(f) || new Stack(f);
            return f;
        },
        unsubscribe: function (topic, fn) {
            var stack = getTopic(topic);
            if (stack) {
                if (stack.uses(fn)) {
                    topics[topic] = stack.drop();
                } else {
                    stack = stack.composedWith(fn);
                    if (stack) {
                        stack.remove();
                    }
                }
            }
        },
        publish: function (topic) {
            return function () {
                var args = arguments;
                getStacks(topic).forEach(function (stack) {
                    stack.apply(args);
                });
            };
        },
        installTo: function (obj) {
            var self = this;
            obj.publish = function () {
                return self.publish.apply(self, arguments);
            };
            obj.subscribe = function () {
                return self.subscribe.apply(self, arguments);
            };
            obj.unsubscribe = function () {
                return self.unsubscribe.apply(self, arguments);
            }
        }
    };
}(this));
