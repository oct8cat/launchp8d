(function() {
    'use strict';

    var async = require('async');

    /**
     * @constructor
     * @alias Launchpad
     * @global
     */
    function Launchpad() {}

    /**
     * Tasks hash name.
     * @type string
     */
    Launchpad.tasksHash = 'launchpad:tasks';

    /**
     * Redis reference.
     * @type object
     */
    Launchpad.redis = require('redis');

    /**
     * Redis client reference.
     * @type object
     */
    Launchpad.client = Launchpad.redis.createClient();

    Launchpad.addTask = function(key, task, cb) {
        Launchpad.client.hmset(Launchpad.tasksHash, key, JSON.stringify(task), cb);
        return Launchpad;
    }

    Launchpad.getTask = function(key, cb) {
        Launchpad.client.hmget(Launchpad.tasksHash, key, function(err, rawTask) {
            cb(err, JSON.parse(rawTask));
        });
        return Launchpad;
    }

    Launchpad.getTasks = function(cb) {
        Launchpad.client.hgetall(Launchpad.tasksHash, function(err, rawTasks) {
            if (err) { cb(err); return; }
            var tasks = [];
            Object.keys(rawTasks).forEach(function(key) {
                tasks.push({key: key, value: JSON.parse(rawTasks[key])});
            });
            cb(err, tasks);
        });
        return Launchpad;
    }

    Launchpad.deleteTask = function(key, cb) {
        Launchpad.client.hdel(Launchpad.tasksHash, key, cb);
        return Launchpad;
    }

    Launchpad.deleteTasks = function(cb) {
        Launchpad.client.hkeys(Launchpad.tasksHash, function(err, keys) {
            if (err) { cb(err); return; }
            async.each(keys, function(key, cb) {
                Launchpad.client.hdel(Launchpad.tasksHash, key, cb);
            }, cb);
        });
        return Launchpad;
    }

    module.exports = Launchpad;

})();
