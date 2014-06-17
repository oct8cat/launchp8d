(function() {
    'use strict';

    var async = require('async');
    var _ = require('underscore');

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
     * Subscriber-mode redis client reference.
     * @type object
     */
    Launchpad.subClient = Launchpad.redis.createClient();

    /**
     * Messages dictionary.
     * @type object.<string, string>
     */
    Launchpad.messages = {
        RUN: 'task:run',
        COMPLETE: 'task:complete'
    };

    /**
     * Runnables array.
     * @type Array.<object>
     */
    Launchpad.runnables = require('./runnables');

    /**
     * Channels array.
     * @type Array.<string>
     */
    Launchpad.channels = [];

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
            cb(err, rawTask[0] ? JSON.parse(rawTask) : null);
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

    /**
     * Subscribes to the channel.
     * @param {string} channel Channel.
     * @param {function} [cb] Callback.
     */
    Launchpad.subscribe = function(channel) {
        Launchpad.channels.push(channel);
        Launchpad.subClient.subscribe.apply(Launchpad.subClient, arguments);
        return Launchpad;
    };

    /**
     * Unsubscribes from a channel.
     * @param {string} channel Channel.
     * @param {function} [cb] Callback.
     */
    Launchpad.unsubscribe = function(channel) {
        Launchpad.channels.splice(Launchpad.channels.indexOf(channel), 1);
        Launchpad.subClient.unsubscribe.apply(Launchpad.subClient, arguments);
        return Launchpad;
    };

    /** Starts listening for pub/sub messages. */
    Launchpad.start = function() {
        Launchpad.subClient.on('message', Launchpad._onMessage);
        return Launchpad;
    };

    /** Unsubscribes from all channels and stops listening for pub/sub messages. */
    Launchpad.stop = function(cb) {
        async.each(Launchpad.channels, Launchpad.unsubscribe, function() {
            Launchpad.subClient.removeAllListeners('message');
            cb(null);
        });
        return Launchpad;
    };

    Launchpad._onMessage = function(channel, message) {
        message = JSON.parse(message);
        if (message.type === Launchpad.messages.RUN) {
            var key = message.task;
            Launchpad.getTask(key, function(err, task) {
                if (err) { Launchpad._error(err); return; }
                if (!task) { Launchpad._error('Task not found: ' + key); return; }
                Launchpad.runTask(task, function(err, result) {
                    var message = {type: Launchpad.messages.COMPLETE, task: key, success: !err, result: result};
                    Launchpad.client.publish(channel, JSON.stringify(message));
                });
            });
        } else if (message.type === Launchpad.messages.COMPLETE) {
            // Complete
        } else {
            Launchpad._error('Unknown message: ', message);
        }
        return Launchpad;
    };

    /**
     * Runs the task.
     * @param {object} task Task. The task's `type` field should be a registered runnable's name.
     * @param {function} cb Callback.
     */
    Launchpad.runTask = function(task, cb) {
        var runnable = Launchpad.getRunnable(task.type);
        if (!runnable) { cb('Runnable not found: ' + task.type); return; }
        runnable.run(task.params, cb);
        return Launchpad;
    };

    /**
     * Retrieves a runnable by its name.
     * @param {string} name Name.
     */
    Launchpad.getRunnable = function(name) {
        return _.findWhere(Launchpad.runnables, {name: name});
    };

    /**
     * Registers a runnable.
     * @param {string} name Name.
     * @param {function} run The runnable's `run` method.
     */
    Launchpad.addRunnable = function(name, run) {
        Launchpad.runnables.push({name: name, run: run});
        return Launchpad;
    };

    /** Simple error handler. */
    Launchpad._error = function() {
        console.error.apply(console, arguments);
    };

    module.exports = Launchpad;

})();
