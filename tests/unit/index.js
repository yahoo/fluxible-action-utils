/* global before, describe, it */

'use strict';

var ROOT_DIR = require('path').resolve(__dirname, '../..');
var expect = require('chai').expect;
var webpack = require('webpack');

describe('index', function () {
    var index;

    before(function () {
        index = require(ROOT_DIR);
    });

    var SUPPORTED_METHODS = [
        'toAsyncTask',
        'executeMultiple',
        'executeCritical'
    ];

    it('should support ' + SUPPORTED_METHODS.join(', '), function () {
        SUPPORTED_METHODS.forEach(function (method) {
            expect(index).to.respondTo(method);
        });
    });

    it('should not error when requiring the webpack generated file', function (done) {
        var config = {
            entry: ROOT_DIR,
            output: {
                path: ROOT_DIR + '/artifacts/webpack-test',
                filename: 'fluxible-action-utils.webpack.js'
            }
        };

        webpack(config, function (err, stats) {
            expect(err).to.equal(null);
            require([config.output.path, config.output.filename].join('/'));
            done();
        });
    });
});
