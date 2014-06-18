(function() {
    'use strict';

    var exec = require('child_process').exec;
    var rssi = require('rssi');
    var async = require('async');

    // TODO accept more parameters.
    var formats = [
        {id: 'mp3', t: rssi('ffmpeg -i #{src} #{dest}')},
        {id: 'ogg', t: rssi('ffmpeg -i #{src} #{dest}')}
    ];

    function run(params, cb) {
        async.map(formats, function(format, cb) {
            var dest = params.dest + '.' + format.id;
            var cmd = format.t({src: params.src, dest: dest});
            exec(cmd, function(err) {
                if (err) { cb(err); return}
                cb(err, {format: format.id, path: dest});
            });
        }, cb);
    }

    module.exports = {name: 'audio', run: run};

})();
