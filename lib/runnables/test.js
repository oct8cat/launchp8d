(function() {
    'use strict';

    function run(params, cb) {
        setTimeout(function() {
            cb(null, 'This is a test result');
        }, 100);
    }

    module.exports = {name: 'test', run: run};

})();
