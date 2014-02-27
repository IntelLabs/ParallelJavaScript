// Counting frames per second
// ==========================
//
// My basic strategy is to divide the time taken over the
// last n frames and return n seconds / time seconds.
//
// I must provide a method to say that a frame is done, so that
// the time can be recorded and a method to get the current FPS,
// and I must store the last n + 1 (because of the fencepost
// problem) times.

// Implicit style
// --------------
//
// Use an empty array for a new counter. Call `add_time(times)` every frame
// and `get_fps(times)` to read the current fps, or just call `tick(times)`
// to do both. This isn't OOP in any sense, there's no encapsulation or
// polymorphism or anything... but it works right?

var add_time, get_fps, tick, span = 20;

add_time = function (times) {
    times.unshift(+new Date());
};

get_fps = function (times) {
    var seconds;

    if (times.length > span) {
        times.pop(); // ditch the oldest time
        seconds = (times[0] - times[times.length - 1]) / 1000;
        return Math.round(span / seconds);
    } else {
        return null;
    }
};

tick = function (times) {
    add_time(times);
    return get_fps(times);
};


// Constructor style
// -----------------
//
// To get a new counter call `var counter = new FPSCounter();`
// you then call `fps = counter.tick()` every frame.
var FPSCounter = function () {
    this.times = [];
};

FPSCounter.prototype = {
    tick: function () {
        var times = this.times,
            seconds;

        times.unshift(+new Date());

        if (times.length > this.span + 1) {
            times.pop(); // ditch the oldest time
            seconds = (times[0] - times[times.length - 1]) / 1000;
            return Math.round(this.span / seconds);
        } else {
            return null;
        }
    },

    span: 20
};

// Prototype style
// ---------------
//
// To get a new counter call `var counter = Object.create(fps_counter)`
// you then call `fps = counter.tick()` every frame.
var fps_counter = {
    tick: function () {
        // this has to clone the array every tick so that
        // separate instances won't share state
        this.times = this.times.concat(+new Date());
        var seconds, times = this.times;

        if (times.length > this.span + 1) {
            times.shift(); // ditch the oldest time
            seconds = (times[times.length - 1] - times[0]) / 1000;
            return Math.round(this.span / seconds);
        } else {
            return null;
        }
    },


    times: [],
    span: 20
};

// Closure style
// -------------
//
// To get a new counter call `var tick = fps_counter()`
// you then call `fps = tick()` every frame
var fps_counter = function (span) {
    var times = [];
    span = span || 20;

    // tick() returns either null or the current FPS
    return function tick() {
        var seconds;

        times.unshift(+new Date());

        if (times.length > span + 1) {
            times.pop(); // ditch the oldest time
            seconds = (times[0] - times[times.length - 1]) / 1000;
            return Math.round(span / seconds);
        } else {
            return null;
        }
    };
};