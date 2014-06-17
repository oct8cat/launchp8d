(function() {
    'use strict';

    var assert = require('assert');
    var Launchpad = require('../lib/Launchpad');

    var fixtures = {
        task: {type: 'type', params: {src: 'src', dest: 'dest'}},
        key: function() { return (new Date()).getTime().toString(); }
    };

    describe('Launchpad', function() {

        before(function() {
            Launchpad.tasksHash += ':' + process.env.NODE_ENV;
        });

        beforeEach(Launchpad.deleteTasks);

        describe('.addTask()', function() {
            it('should add the task to redis hash', function(done) {
                var task = fixtures.task;
                var key = fixtures.key();
                Launchpad.addTask(key, task, function(err) {
                    if (err) { done(err); return; }
                    Launchpad.client.hmget(Launchpad.tasksHash, key, function(err, rawTask) {
                        if (err) { done(err); return; }
                        var json = JSON.parse(rawTask);
                        assert.equal(task.type, json.type);
                        assert.deepEqual(task.params, json.params);
                        done(err);
                    });
                });
            });
        });

        describe('.getTask()', function() {
            it('should retrieve a task by its key', function(done) {
                var task = fixtures.task;
                var key = fixtures.key();
                Launchpad.addTask(key, task, function(err) {
                    if (err) { done(err); return; }
                    Launchpad.getTask(key, function(err, task2) {
                        if (err) { done(err); return; }
                        assert.equal(task.type, task2.type);
                        assert.deepEqual(task.params, task2.params);
                        done(err);
                    });
                });
            });
        });

        describe('.getTasks()', function() {
            it('should retrieve an array of tasks', function(done) {
                var key = fixtures.key();
                var task = fixtures.task;
                Launchpad.addTask(key, task, function(err) {
                    if (err) { done(err); return; }

                    Launchpad.getTasks(function(err, tasks) {
                        if (err) { done(err); return; }
                        assert.equal(tasks.length, 1);
                        done(err);
                    });
                });
            });
        });

        describe('.deleteTask()', function() {
            it('should delete a task by its key', function(done) {
                var key = fixtures.key();
                var task = fixtures.task;
                Launchpad.addTask(key, task, function(err) {
                    if (err) { done(err); return; }
                    Launchpad.deleteTask(key, function(err) {
                        if (err) { done(err); return; }
                        Launchpad.client.hkeys(Launchpad.tasksHash, function(err, keys) {
                            if (err) { done(err); return; }
                            assert.equal(keys.length, 0);
                            done(err);
                        });
                    });
                });
            });
        });

        describe('.deleteTasks()', function() {
            it('should delete all tasks', function(done) {
                Launchpad.deleteTasks(function(err) {
                    if (err) { done(err); return; }
                    Launchpad.client.hkeys(Launchpad.tasksHash, function(err, keys) {
                        if (err) { done(err); return; }
                        assert.equal(keys.length, 0);
                        done();
                    });
                });
            });
        });
    });

})();
