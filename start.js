(function() {
    'use strict';

    var channel = process.env.CHANNEL || 'launchpad';

    require('./lib/Launchpad').start().subscribe(channel, function() {
        console.log('Now running on "' + channel + '" channel.');
    });

})();
