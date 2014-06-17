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

    /**
     * Adds a task with the given key.
     * @param {string} key Key.
     * @param {object} task Task.
     * @param {function} cb Callback.
     */
    Launchpad.addTask = function(key, task, cb) {
        Launchpad.client.hmset(Launchpad.tasksHash, key, JSON.stringify(task), cb);
        return Launchpad;
    };

    /**
     * Retrieves a task by its key.
     * @param {string} key Key.
     * @param {function} cb Callback.
     */
    Launchpad.getTask = function(key, cb) {
        Launchpad.client.hmget(Launchpad.tasksHash, key, function(err, rawTask) {
            cb(err, JSON.parse(rawTask));
        });
        return Launchpad;
    };

    /**
     * Retrieves all registered tasks as `Array.<{key: string, value: object}>`.
     * @param {function} cb Callback.
     */
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
    };

    /**
     * Deletes a task by its key.
     * @param {string} key Key.
     * @param {function} cb Callback.
     */
    Launchpad.deleteTask = function(key, cb) {
        Launchpad.client.hdel(Launchpad.tasksHash, key, cb);
        return Launchpad;
    };

    /**
     * Deletes all registered tasks.
     * @param {function} cb Callback.
     */
    Launchpad.deleteTasks = function(cb) {
        Launchpad.client.hkeys(Launchpad.tasksHash, function(err, keys) {
            if (err) { cb(err); return; }
            async.each(keys, function(key, cb) {
                Launchpad.client.hdel(Launchpad.tasksHash, key, cb);
            }, cb);
        });
        return Launchpad;
    };

    module.exports = Launchpad;

})();
