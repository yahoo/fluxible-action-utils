/* global describe, it */

'use strict';

var ROOT_DIR = require('path').resolve(__dirname, '../../..');

var expect = require('chai').expect;
var continueOnError = require(ROOT_DIR + '/internals/continueOnError.js');

describe('fluxible-action-utils.internals#continueOnError', function () {
    it('should call callback with data if the returned function is passed data with no error', function (cb) {
        var payload = 'actual data';
        var callback = function (err, data) {
            expect(err).to.equal(null);
            expect(data).to.be.a('string').and.equal(payload);
            cb();
        };

        continueOnError(callback)(null, payload);
    });

    it('should call callback with data.err if the returned function is passed an error', function (cb) {
        var error = {status: 404, message: 'Not Found'};
        var callback = function (err, data) {
            expect(err).to.equal(null);
            expect(data).to.be.an('object').and.have.property('err', error);
            cb();
        };

        continueOnError(callback)(error);
    });

    it('should call callback with data[errProp] if the returned function is passed an error and errProp', function (cb) {
        var error = {status: 404, message: 'Not Found'};
        var callback = function (err, data) {
            expect(err).to.equal(null);
            expect(data).to.be.an('object').and.have.property('error', error);
            cb();
        };

        continueOnError('error', callback)(error);
    });
});
