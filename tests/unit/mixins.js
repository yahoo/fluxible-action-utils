/* global describe, it */

'use strict';

var createReactClass = require('create-react-class');
var sinon = require('sinon');
var expect = require('chai').expect;
var JSDOM = require('jsdom').JSDOM;
var React = require('react');
var ReactDOM = require('react-dom');
var PeriodicActionsMixin = require('./../../mixins').PeriodicActions;
var PropTypes = require('prop-types');

global.window = new JSDOM('<!doctype html><html><body></body></html>').window;
global.document = global.window.document;
global.navigator = global.window.navigator;

function mockExecuteAction (action, params) {
    action(params);
}

function renderComponent (classSpec, container) {
    var _classSpec = {
        mixins: [PeriodicActionsMixin],
        render: function () {
            return React.createElement('span', null, '');
        }
    };

    Object.keys(classSpec).forEach(function (key) {
        _classSpec[key] = classSpec[key];
    });

    ReactDOM.render(
        React.createElement(
            createReactClass({
                childContextTypes: {
                    executeAction: PropTypes.func
                },
                getChildContext: function () {
                    return {
                        executeAction: mockExecuteAction
                    };
                },
                render: function () {
                    return React.createElement(
                        createReactClass(_classSpec)
                    );
                }
            })
        ),
        container
    );
}

function unmount (container) {
    ReactDOM.render(
        React.createElement(
            createReactClass({
                render: function () {
                    return null;
                }
            })
        ),
        container
    );
}

describe('PeriodicActions', function () {
    it('has a custom validator for context.executeAction', function () {
        var contextTypes = PeriodicActionsMixin.contextTypes;
        var executeActionValidator = null;

        expect(contextTypes).to.be.an('object');

        executeActionValidator = contextTypes.executeAction;
        expect(executeActionValidator).to.be.a('function');

        // Test inputs
        [
            false,
            true,
            null,
            undefined,
            0,
            10,
            '',
            'nope',
            /test/,
            {},
            []
        ].forEach(function (value) {
            expect(executeActionValidator({executeAction: value}, 'executeAction')).to.be.an.instanceof(Error);
        });

        expect(executeActionValidator({executeAction: function () {}}, 'executeAction')).to.be.undefined;
    });

    it('will fire periodic actions and stop', function () {
        // We'll need to be able to speed up time
        var clock = sinon.useFakeTimers();

        var div = global.document.createElement('div');
        var called = 0;

        // Mount a component using the mixin
        renderComponent({
            statics: {
                periodicActions: [
                    {
                        uuid: 'UNIQUE_ID',
                        action: function (params) {
                            called += params.add;
                        },
                        params: {
                            add: 1
                        },
                        interval: 10
                    }
                ]
            }
        }, div);

        // Let the clock tick so it fires off actions
        clock.tick(501);
        expect(called).to.equal(50);

        clock.tick(500);
        expect(called).to.equal(100);

        // Unmount the above component
        unmount(div);

        // Advance the clock again, actions should not have fired
        clock.tick(1001);
        expect(called).to.equal(100);

        // Cleanup
        clock.restore();
    });

    it('will not work without uuid', function () {
        // We'll need to be able to speed up time
        var clock = sinon.useFakeTimers();

        var div = global.document.createElement('div');
        var called = 0;

        // Mount a component using the mixin
        renderComponent({
            statics: {
                periodicActions: [
                    {
                        action: function () {
                            called += 1;
                        },
                        interval: 10
                    }
                ]
            }
        }, div);

        // Let the clock tick, will do nothing
        clock.tick(501);
        expect(called).to.equal(0);

        clock.tick(500);
        expect(called).to.equal(0);

        // Unmount the above component
        unmount(div);

        // Cleanup
        clock.restore();
    });

    it('will not work without an action', function () {
        var div = global.document.createElement('div');

        // Mount a component using the mixin
        renderComponent({
            componentDidMount: function () {
                expect(this.startPeriodicAction('UNIQUE_ID')).to.equal(false);
                expect(this.stopPeriodicAction('UNIQUE_ID')).to.equal(false);
            }
        }, div);

        // Unmount the above component
        unmount(div);
    });

    it('can add and remove many actions', function () {
        var div = global.document.createElement('div');
        function noop () {
            return;
        }

        // Mount a component using the mixin
        renderComponent({
            componentDidMount: function () {
                expect(this.startPeriodicAction('UNIQUE_ID', noop, 100)).to.equal(true);
                expect(this.startPeriodicAction('UNIQUE_ID_2', noop)).to.equal(true);
                expect(this.stopPeriodicAction('UNIQUE_ID_2')).to.equal(true);
                expect(this.stopPeriodicAction('UNIQUE_ID')).to.equal(true);
            }
        }, div);

        // Unmount the above component
        unmount(div);
    });

    it('fails to remove non-string uuid', function () {
        var div = global.document.createElement('div');
        function noop () {
            return;
        }

        // Mount a component using the mixin
        renderComponent({
            componentDidMount: function () {
                expect(this.startPeriodicAction('0', noop)).to.equal(true);
                expect(this.stopPeriodicAction(0)).to.equal(false);
            }
        }, div);

        // Unmount the above component
        unmount(div);
    });

    it('will not mount two actions with the same uuid', function () {
        var div = global.document.createElement('div');
        function noop () {
            return;
        }

        // Mount a component using the mixin
        renderComponent({
            componentDidMount: function () {
                expect(this.startPeriodicAction('0', noop)).to.equal(true);
                expect(this.startPeriodicAction('0', noop)).to.equal(false);
            }
        }, div);

        // Unmount the above component
        unmount(div);
    });
});
