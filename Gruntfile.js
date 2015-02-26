'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        eslint: {
            target: ['.']
        }
    });

    grunt.registerTask('default', []);
    grunt.registerTask('lint', ['eslint']);
};
