function Given(fn) {
    if (!(this instanceof Given)) {
        return new Given(fn);
    }
    this.conditions = this.results = new Stack(fn);
};
Given.prototype.and = function (fn) {
    this.conditions = this.conditions.push(fn);
    return this;
};
Given.prototype.when = function (topic) {
    var self = this;
    pubsub.subscribe(topic, function (data) {
        self.conditions.every(data);
    });
    return this;
};
Given.prototype.then = function (fn) {
    this.results.insert(fn);
    return this;
};

/**/
Given(function (data) {
        return data === 1;
    })
    .when("test")
    .then(function () {
        console.log("success");
    });

pubsub.publish("test", 1);
pubsub.publish("test", 2);
