(function() {
    'use strict';

    var assert = require('assert');
    var Launchpad = require('../lib/Launchpad');
    var j = require('path').join;

    var DIR_FIXTURES = j(__dirname, 'fixtures');

    var fixtures = {
        task: {type: 'test', params: {test: 'test'}},
        key: function() { return (new Date()).getTime().toString(); },
        channel: 'launchpad',
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

        describe('.start()', function() {
            before(function(done) {
                Launchpad.loadRunnables(j(DIR_FIXTURES, 'runnables')).start().subscribe(fixtures.channel, done);
            });

            after(function(done) { Launchpad.unloadRunnables().stop(done); });

            it('should run a task on "task:run" message', function(done) {
                var key = fixtures.key();
                var task = fixtures.task;
                Launchpad.addTask(key, task, function(err, task) {
                    Launchpad.subClient.on('message', function(channel, message) {
                        message = JSON.parse(message);
                        if (message.type === Launchpad.messages.COMPLETE) {
                            var err = typeof message.error === 'string' ? new Error(message.error) : message.error;
                            done(err);
                        }
                    });
                    var message = {type: Launchpad.messages.RUN, task: key};
                    Launchpad.client.publish(fixtures.channel, JSON.stringify(message));
                });
            });
        });

        describe('.stop()', function() {
            it('should remove all listeners', function(done) {
                Launchpad.start(fixtures.channel);
                assert.equal(Object.keys(Launchpad.subClient._events).length, 1);
                Launchpad.stop(function() {
                    assert.equal(Object.keys(Launchpad.subClient._events).length, 0);
                    done();
                });
            });
        });

        describe('.loadRunnables()', function() {
            after(function(done) { Launchpad.unloadRunnables(); done(); });

            it('should put loaded runnables into `Launchpad.runnables` array.', function(done) {
                assert.equal(Launchpad.runnables.length, 0);
                Launchpad.loadRunnables(j(DIR_FIXTURES, 'runnables'));
                assert.equal(Launchpad.runnables.length, 1);
                done();
            });
        });

        describe('.unloadRunnables()', function() {
            before(function(done) { Launchpad.loadRunnables(j(DIR_FIXTURES, 'runnables')); done(); });

            it('should empty `Launchpad.runnables` array', function(done) {
                assert.equal(Launchpad.runnables.length, 1);
                Launchpad.unloadRunnables();
                assert.equal(Launchpad.runnables.length, 0);
                done();
            });
        });
    });

})();
