/* global describe, it, before, after */

'use strict';

var ROOT_DIR = require('path').resolve(__dirname, '../../..');
var mockery = require('mockery');

var expect = require('chai').expect;

var modulePath = ROOT_DIR + '/internals/getTasksForAsync.js';

describe('fluxible-action-utils.internals#getTasksForAsync', function () {
    var getTasksForAsync;

    var mockAction = {};
    var mockContext = {};
    var mockParams = {};

    var actions = {
        foo: mockAction,
        bar: {
            action: mockAction,
            params: mockParams
        },
        baz: ['foo', 'bar', {action: mockAction, isCritical: true}]
    };

    function checkAction (task, taskName, params, isCritical) {
        expect(task).to.have.property('action', mockAction);
        expect(task).to.have.property('context', mockContext);
        expect(task).to.have.property('taskName', taskName);
        expect(task).to.have.property('params', params);
        expect(task).to.have.property('isCritical', isCritical);
    }

    before(function () {
        mockery.enable({
            useCleanCache: true
        });
        mockery.registerAllowable(modulePath);
        mockery.registerMock('./../async/toAsyncTask', function (action, context, params, isCritical, taskName) {
            return {
                action: action,
                context: context,
                params: params || null,
                isCritical: isCritical,
                taskName: taskName
            };
        });

        getTasksForAsync = require(modulePath);
    });

    it('should parse and pass the proper parameters to "toAsyncTask" if passed proper FluxibleActions', function () {
        var tasks = getTasksForAsync(mockContext, actions);

        expect(tasks.foo).to.be.an('array').of.length(1);
        checkAction(tasks.foo[0], 'foo', null, false);

        expect(tasks.bar).to.be.an('array').of.length(1);
        checkAction(tasks.bar[0], 'bar', mockParams, false);

        expect(tasks.baz).to.be.an('array').of.length(3);
        expect(tasks.baz[0]).to.equal('foo');
        expect(tasks.baz[1]).to.equal('bar');
        checkAction(tasks.baz[2], 'baz', null, true);
    });

    it('should ignore the isCritical property if the "isAlwaysCritical" flag is "true"', function () {
        var tasks = getTasksForAsync(mockContext, actions, true);

        expect(tasks.foo).to.be.an('array').of.length(1);
        checkAction(tasks.foo[0], 'foo', null, true);

        expect(tasks.bar).to.be.an('array').of.length(1);
        checkAction(tasks.bar[0], 'bar', mockParams, true);

        expect(tasks.baz).to.be.an('array').of.length(3);
        expect(tasks.baz[0]).to.equal('foo');
        expect(tasks.baz[1]).to.equal('bar');
        checkAction(tasks.baz[2], 'baz', null, true);
    });

    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
});
