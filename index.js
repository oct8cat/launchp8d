(function() {
    'use strict';

    var Launchpad = require('./lib/Launchpad');

    function next(err) {
        if (err) { console.error(err); }
        process.exit(1);
    }

    Launchpad.init(function(err) {
        if (err) { next(err); return; }
        Launchpad.subscribe('Launchpad');
    });

})();
