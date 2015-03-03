/* global before, describe, it */

'use strict';

var ROOT_DIR = require('path').resolve(__dirname, '../..');
var expect = require('chai').expect;
var webpack = require('webpack');

describe('fluxible-action-utils', function () {
    var SUPPORTED = [
        'async',
        'mixins'
    ];

    var index;

    before(function () {
        index = require(ROOT_DIR);
    });

    it('should support ' + SUPPORTED.join(', '), function () {
        SUPPORTED.forEach(function (method) {
            expect(index).to.have.property(method);
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
