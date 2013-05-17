function Feature(description) {
    if (!(this instanceof Feature)) {
        return new Feature(description);
    }
    this.description = description;
    this.disable = function () {};
    this.conditions = this.results = new Stack();
}
Feature.alias = function (prop, rename) {
    this.prototype[rename] = this.prototype[prop];
    return this;
};
Feature.prototype.given = function (fn) {
    this.conditions = this.conditions.push(fn);
    return this;
};
Feature.prototype.when = function (topic) {
    var self = this;
    this.disable = function (fn) {
        return function () {
            Feature.unsubscribe(topic, fn);
        };
    }(Feature.subscribe(topic, function (data) {
        self.conditions.every(data);
    }));
    return this;
};
Feature.prototype.then = function (fn) {
    this.results.insert(fn);
    return this;
};
Feature.prototype.unless = function (fn) {
    this.conditions = this.conditions.push(function () {
        return !fn.apply(this, arguments);
    });
    return this;
};
Feature.prototype.until = function (topic) {
    Feature.subscribe(topic, this.disable);
    return this;
};
/**
 * @borrows given as and
 */
Feature.alias("given", "and")
/**
 * @borrows unless as or
 */
    .alias("unless", "or");
PubSub.installTo(Feature);