(function() {
    'use strict';

    /**
     * External runnables module path.
     * Defaults to '../runnables'
     * @type string
     */
    var RUNNABLES = require('path').join(__dirname, '..', 'runnables');
    if (process.argv.length > 2) { RUNNABLES = process.argv[2]; }

    /**
     * Pub/Sub channel name.
     * @type string
     */
    var channel = process.env.CHANNEL || 'launchpad';

    var settings = require('./settings');

    require('./lib/Launchpad')(settings).loadRunnables(RUNNABLES).start().subscribe(channel, function() {
        console.log('Now running on "' + channel + '" channel.');
    });

})();
