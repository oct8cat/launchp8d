(function() {
    'use strict';

    var runnables = [
        {
            name: 'test',
            run: function(params, cb) {
                setTimeout(function() {
                    cb(null, 'This is a test result');
                }, 100);
            }
        }
    ];

    module.exports = runnables;

})();
