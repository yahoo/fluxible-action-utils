/* global before, describe, it */

'use strict';

var ROOT_DIR = require('path').resolve(__dirname, '../..');
var expect = require('chai').expect;
var series = require('run-series');

describe('fluxible-action-utils.async', function () {
    var actionUtilsAsync;

    var mockContext = {
        name: 'mockContext',
        executeAction: function (action, params, done) {
            action(this, params, done);
        }
    };

    var mockError = {
        status: 400,
        message: 'Bad Request'
    };

    function mockAction (err, data, expectedParams) {
        return function (context, params, done) {
            expect(context).to.equal(mockContext);
            expect(params).to.equal(expectedParams);
            done(err, data);
        };
    }

    before(function () {
        actionUtilsAsync = require(ROOT_DIR + '/async');
    });

    describe('#toAsyncTask', function () {
        var mockParams = {
            name: 'mockParams'
        };

        it('should return a function', function () {
            expect(actionUtilsAsync.toAsyncTask()).to.be.a('function');
        });

        it('should call the action with the proper arguments', function (done) {
            var task = actionUtilsAsync.toAsyncTask(mockAction(undefined, undefined, mockParams), mockContext, mockParams);
            task(done);
        });

        it('should continue on error by default', function (done) {
            var task = actionUtilsAsync.toAsyncTask(mockAction(mockError, undefined, mockParams), mockContext, mockParams);

            task(function (err, data) {
                expect(err).to.not.exist;
                expect(data).to.be.an('object').and.have.property('err', mockError);
                done();
            });
        });

        it('should not continue on error if "true" is passed as a fourth param', function (done) {
            var task = actionUtilsAsync.toAsyncTask(mockAction(mockError, undefined, mockParams),
                mockContext, mockParams, true);

            task(function (err, data) {
                expect(err).to.be.an('object').and.equal(mockError);
                done();
            });
        });

        it('should not continue on error if "true" is passed as a fourth param, and it should wrap the error under' +
            'the provided taskName', function (done) {
            var task = actionUtilsAsync.toAsyncTask(mockAction(mockError, undefined, mockParams),
                mockContext, mockParams, true, 'foo');

            task(function (err, data) {
                expect(err).to.be.an('object').and.deep.equal({
                    foo: mockError
                });
                done();
            });
        });
    });

    describe('#executeMultiple', function () {
        it('should support not passing a "done" callback', function () {
            actionUtilsAsync.executeMultiple(mockContext, {
                foo: mockAction(null, 'foo'),
                bar: {
                    action: mockAction(null, 'bar'),
                    isCritical: true
                },
                baz: ['foo', 'bar', mockAction(null, 'baz')]
            });
        });

        it('should properly convert the custom actions object to a valid "async.auto" tasks object', function (done) {
            var foo = mockAction(null, 'foo');

            var params = {
                test: true
            };
            var bar = mockAction(null, 'bar', params);

            var baz = mockAction(null, 'baz');

            var fubar = mockAction(null, 'fubar');

            var tasks = {
                foo: {
                    action: foo,
                    isCritical: true
                },
                bar: ['foo', {
                    action: bar,
                    params: params
                }],

                baz: baz,

                fubar: ['bar', fubar]
            };

            actionUtilsAsync.executeMultiple(mockContext, tasks, function (err, results) {
                expect(err).to.not.exist;
                expect(results).to.be.an('object').and.deep.equal({
                    foo: 'foo',
                    bar: 'bar',
                    baz: 'baz',
                    fubar: 'fubar'
                });
                done();
            });
        });

        it('should allow you to re-use the same actions object', function (done) {
            var foo = mockAction(null, 'foo');

            var params = {
                test: true
            };
            var bar = mockAction(null, 'bar', params);

            var baz = mockAction(null, 'baz');

            var fubar = mockAction(null, 'fubar');

            var tasks = {
                foo: {
                    action: foo,
                    isCritical: true
                },
                bar: ['foo', {
                    action: bar,
                    params: params
                }],

                baz: baz,

                fubar: ['bar', fubar]
            };

            function run (cb) {
                actionUtilsAsync.executeMultiple(mockContext, tasks, function (err, results) {
                    expect(err).to.not.exist;
                    expect(results).to.be.an('object').and.deep.equal({
                        foo: 'foo',
                        bar: 'bar',
                        baz: 'baz',
                        fubar: 'fubar'
                    });
                    cb();
                });
            }

            series([
                run,
                run
            ], done);
        });

        it('should respect task order and fail out of the entire async.auto block if a critical task fails',
            function (done) {
                var foo = mockAction(mockError);

                var params = {
                    test: true
                };
                var bar = mockAction(null, 'bar', params);

                var baz = mockAction(null, 'baz');

                var tasks = {
                    foo: ['baz', {
                        action: foo,
                        isCritical: true
                    }],
                    bar: ['foo', {
                        action: bar,
                        params: params
                    }],
                    baz: baz
                };

                actionUtilsAsync.executeMultiple(mockContext, tasks, function (err, results) {
                    expect(err).to.exist.and.deep.equal({
                        foo: mockError
                    });

                    expect(results).to.be.an('object').and.have.property('baz', 'baz');
                    expect(results.foo).to.not.be.ok;
                    expect(results.bar).to.not.be.ok;

                    done();
                });
            }
        );

        it('should aggregate non-critical task errors under "err.taskName"', function (done) {
            var foo = mockAction('foo');

            var params = {
                test: true
            };
            var bar = mockAction('bar', null, params);

            var baz = mockAction('baz', null);

            var tasks = {
                foo: ['baz', foo],
                bar: ['foo', {
                    action: bar,
                    params: params
                }],
                baz: baz
            };

            actionUtilsAsync.executeMultiple(mockContext, tasks, function (err, results) {
                expect(err).to.be.an('object').and.deep.equal({
                    foo: 'foo',
                    bar: 'bar',
                    baz: 'baz'
                });
                expect(results).to.deep.equal({
                    foo: null,
                    bar: null,
                    baz: null
                });
                done();
            });
        });
    });
    describe('#executeCritical', function () {
        it('should support not passing a "done" callback', function () {
            actionUtilsAsync.executeCritical(mockContext, {
                foo: mockAction(null, 'foo'),
                bar: {
                    action: mockAction(null, 'bar')
                },
                baz: ['foo', 'bar', mockAction(null, 'baz')]
            });
        });

        it('should properly convert the custom actions object to a valid "async.auto" tasks object', function (done) {
            var foo = mockAction(null, 'foo');

            var params = {
                test: true
            };
            var bar = mockAction(null, 'bar', params);

            var baz = mockAction(null, 'baz');

            var fubar = mockAction(null, 'fubar');

            var tasks = {
                foo: {
                    action: foo
                },
                bar: ['foo', {
                    action: bar,
                    params: params
                }],

                baz: baz,

                fubar: ['bar', fubar]
            };

            actionUtilsAsync.executeCritical(mockContext, tasks, function (err, results) {
                expect(err).to.not.exist;
                expect(results).to.be.an('object').and.deep.equal({
                    foo: 'foo',
                    bar: 'bar',
                    baz: 'baz',
                    fubar: 'fubar'
                });
                done();
            });
        });

        it('should fail out of the entire async.auto block if any task fails',
            function (done) {
                var foo = mockAction(mockError);

                var params = {
                    test: true
                };
                var bar = mockAction(null, 'bar', params);

                var baz = mockAction(null, 'baz');

                var tasks = {
                    foo: ['baz', {
                        action: foo
                    }],
                    bar: ['foo', {
                        action: bar,
                        params: params
                    }],
                    baz: baz
                };

                actionUtilsAsync.executeCritical(mockContext, tasks, function (err, results) {
                    expect(err).to.exist.and.deep.equal({
                        foo: mockError
                    });

                    expect(results).to.be.an('object').and.have.property('baz', 'baz');
                    expect(results.foo).to.not.be.ok;
                    expect(results.bar).to.not.be.ok;

                    done();
                });
            }
        );
    });
});
