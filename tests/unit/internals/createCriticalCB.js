/* global describe, it */

'use strict';

var ROOT_DIR = require('path').resolve(__dirname, '../../..');

var expect = require('chai').expect;
var createCriticalCB = require(ROOT_DIR + '/internals/createCriticalCB.js');

describe('fluxible-action-utils.internals#createCriticalCB', function () {
    it('should return a callback that is passthrough by default', function (done) {
        var originalCB = function (err, data) {
            expect(err).to.equal('bad request');
            expect(data).to.equal('data');
            done();
        };

        var criticalCB = createCriticalCB(originalCB);

        criticalCB('bad request', 'data');
    });

    it('should return a callback that wraps errors under a taskname', function (done) {
        var originalCB = function (err, data) {
            expect(err).to.be.an('object').and.have.property('foo', 'bad request');
            expect(data).to.equal('data');
            done();
        };

        var criticalCB = createCriticalCB(originalCB, 'foo');
        criticalCB('bad request', 'data');
    });
});
