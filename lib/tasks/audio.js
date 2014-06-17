(function() {
    'use strict';

    var exec = require('child_process').exec;
    var async = require('async');
    var rssi = require('rssi');

    function run(params, cb) {
        var formats = [
            {id: 'mp3', cmdTemplate: rssi('ffmpeg -y -i #{src} #{dest}')},
            {id: 'ogg', cmdTemplate: rssi('ffmpeg -y -i #{src} #{dest}')},
        ];
        async.map(formats, function(format, cb) {
            var dest = params.dest + '.' + format.id;
            var cmd = format.cmdTemplate({src: params.src, dest: dest});
            exec(cmd, function(err) {
                cb(err, {format: format.id, dest: dest});
            });
        }, cb);
    }

    module.exports = {name: 'audio', run: run};

})();
