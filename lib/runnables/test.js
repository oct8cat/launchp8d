(function() {
    'use strict';

    function run(params, cb) {
        // Implement something serious.
        // Ex.: require('child_process').spawn('ffpmeg -i /tmp/file.mp3 /tmp/file.ogg', cb)
        setTimeout(function() {
            cb(null, 'This is a test result');
        }, 100);
    }

    module.exports = {name: 'test', run: run};

})();
