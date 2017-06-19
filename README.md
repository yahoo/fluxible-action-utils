# fluxible-action-utils

[![Greenkeeper badge](https://badges.greenkeeper.io/yahoo/fluxible-action-utils.svg)](https://greenkeeper.io/)

[![npm version](https://badge.fury.io/js/fluxible-action-utils.svg)](http://badge.fury.io/js/fluxible-action-utils)
[![Build Status](https://travis-ci.org/yahoo/fluxible-action-utils.svg?branch=master)](https://travis-ci.org/yahoo/fluxible-action-utils)
[![Dependency Status](https://david-dm.org/yahoo/fluxible-action-utils.svg)](https://david-dm.org/yahoo/fluxible-action-utils)
[![devDependency Status](https://david-dm.org/yahoo/fluxible-action-utils/dev-status.svg)](https://david-dm.org/yahoo/fluxible-action-utils#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/yahoo/fluxible-action-utils/badge.svg)](https://coveralls.io/r/yahoo/fluxible-action-utils)

[![Join the chat at https://gitter.im/yahoo/fluxible-action-utils](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/yahoo/fluxible-action-utils?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Utility methods to aid in writing [actions](http://fluxible.io/api/fluxible-context.html#executeaction-action-payload-callback-) for [fluxible](http://fluxible.io) based applications.

```bash
$ npm install --save fluxible-action-utils
```

## Modularized Builds/Requires
The utility library provides modularized methods, and method categories to aid in providing smaller [browserify](http://browserify.org/) and [webpack](http://webpack.github.io/) builds.

```js
var actionUtils = require('fluxible-action-utils');
```

Will require the entire library, including **all** available methods grouped under their respective method categories.

For example, the following are equivalent (but will result in varying sized [webpack](http://webpack.github.io/) builds)

### Full Library (results in **largest** build)
```js
var executeMultiple = require('fluxible-action-utils').async.executeMultiple;
```

### Category
```js
var executeMultiple = require('fluxible-action-utils/async').executeMultiple;
```

### Method (results in smallest build)
```js
var executeMultiple = require('fluxible-action-utils/async/executeMultiple');
```

:rotating_light: **WARNING** :rotating_light:

Methods inside the `internals` directory/category are not explicitely exported and are considered unstable.

require externally at your own risk as breaking changes inside `internals` will not be considered `breaking` for the library.

===

## API
* [`async`](#async)
    - [`executeMultiple`](#executemultiple-context-actions-done)
    - [`executeCritical`](#executecritical-context-actions-done)
* [`mixins`](#mixins)
    - [`PeriodicActions`](#periodicactions)

===

### async
*available as of v0.2.0*

```js
var asyncActionUtils = require('fluxible-action-utils/async');
```

Methods grouped under the `async` category are concerned with providing methods that aid in managing the asynchronous control flow of [`fluxible`](http://fluxible.io) actions.

[run-auto](https://github.com/feross/run-auto#usage) is used under the hood to do the actual heavy lifting (thanks to [@feross](https://github.com/feross))

#### executeMultiple (context, actions, [done])
*available as of v0.2.0*

```js
var executeMultiple = require('fluxible-action-utils/async/executeMultiple');
```

Utility method used to execute multiple actions in parallel where possible. Each key in `actions` represents a `task` to be executed (and should be unique).

`actions[task]` can be one of the following

1. {FluxAction} an action to be executed, **cannot** be critical **nor** require params
2. {Object} an action "object" with the follwing properties
    1. `action` {FluxAction} the action to execute
    1. `[isCritical=false]` {Boolean} whether the action is **critical**
    2. `[params]` {Any} parameters to pass to the action when executing it
3. {Array} {String, String, ..., FluxAction|Object} array which defines the tasks/actions that need to be executed before executing the action of type *1.* or *2.* found at the end of the array.

The `done` {Function} parameter is optional, but if provided, will be called when all tasks complete (either with success or failure).
Signature `function (err, results)`

For each task that fails, the error returned will be aggregated under `err[task]`.

**Example**

```js
// initHome.js

var executeMultiple = require('fluxible-action-utils/async/executeMultiple');
var UserStore = require('app/stores/UserStore');

module.exports = function initHome(context, params, done) {
    executeMultiple(context, {
        loadUH: require('UH').actions.load,
        loadUser: {
            action: require('app/actions/loadUser'),
            isCritical: true
        },
        loadStuffForUser: [
            'loadUser',
            {
                // will be executed after 'loadUser' task completes successfully
                action: require('../../actions/loadStuffForUser'),
                params: context.getStore(UserStore).getGUID()
            }
        ],
        populateUserNotifications: [
            'loadUH',
            'loadStuffForUser',

            // will be executed after the 'loadUH' and 'loadStuffForUser' tasks complete successfully
            require('../../actions/populateUserNotifications')
        ]
    }, function (err, results) {
        // there was at least one error, handle them
        if (err) {
            if (err.loadUser) {
                context.dispatch('CATASTROPHE', err.loadUser);
            }

            if(err.loadStuffForUser) {
                context.dispatch('RECOVERABLE', err.loadStuffForUser);
            }
            done();
            return;
        }
        // Yay! no errors
        // ...
        done();
    });
};
```

#### executeCritical (context, actions, [done])
*available as of v0.2.0*

```js
var executeCritical = require('fluxible-action-utils/async/executeCritical');
```

`executeCritical` allows you to execute a group of actions that are **ALL** deemed critical.  This is a simple shorthand for `executeMultiple` when a group of actions are all critical.

### mixins
*available as of v0.2.0*

```js
var mixins = require('fluxible-action-utils/mixins');
```

Mixins grouped under the `mixins` category are concerned with providing React [component mixins](http://facebook.github.io/react/docs/reusable-components.html#mixins) that simplify using [`fluxible`](http://fluxible.io) actions.

#### PeriodicActions
*available as of v0.2.0*

```js
var PeriodicActionsMixin = require('fluxible-action-utils/mixins/PeriodicActions');
```

Utility mixin used to make running an action repeatedly (polling an API for example) easier to do.

You can either write code using the methods exposed by the mixin directly, or you can use the `statics` support.

`uuid` must be a unique identifier, attempting to add another action with the same `uuid` as a currently running periodic action will fail to add.

**Statics Example**

```jsx
// MyReactComponent.jsx

var PeriodicActionsMixin = require('fluxible-action-utils/mixins/PeriodicActions');
var myPollingAction = require('./myPollingAction');

// Let's say you have a child component that implement the controlling logic for the polling action below
var ControlComponent = require('./someControlComponent');

module.exports = createReactClass({
    displayName: 'MyReactComponent',
    mixins: [PeriodicActionsMixin],
    statics: {
        periodicActions: [
            {
                uuid: 'MY_UNIQUE_POLLING_ACTION_UUID_STATICS',
                action: myPollingAction,
                // Optional params
                params: {
                    customPayload: 'payload'
                },
                // Optional timeout (Defaults to 100 ms)
                timeout: 1000
            }
        ]
    },
    render: function () {
        // You can pass the auto-binded component methods to the child component to achieve
        // custom timing on the dedicated action(s)
        return <ControlComponent
                    startPolling={this.startPeriodicActions}
                    stopPolling={this.stopPeriodicActions}
               />;
    }
});
```

**Code Example**

```jsx
// MyReactComponent.jsx

var PeriodicActionsMixin = require('fluxible-action-utils/mixins/PeriodicActions');
var myPollingAction = require('./myPollingAction');

module.exports = createReactClass({
    displayName: 'MyReactComponent',
    mixins: [PeriodicActionsMixin],
    componentDidMount: function () {
        this.startPeriodicAction(
            'MY_UNIQUE_POLLING_ACTION_UUID_CODE',
            myPollingAction,
            // Optional params
            {customPayload: 'payload'},
            // Optional timeout (Defaults to 100 ms)
            1000
        );
    },
    /* Don't need this, all periodic actions will be stopped automatically on unmount
    componentWillUnmount: function () {
        this.stopPeriodicAction('MY_UNIQUE_POLLING_ACTION_UUID_CODE');
    },
    */
    render: function () {
        return null;
    }
});
```

## FAQ
* [what is a **critical** action?](https://github.com/yahoo/fluxible-action-utils/issues/18)

## Thanks
* [@mridgway](https://github.com/mridgway)
* [@akshayp](https://github.com/akshayp)
* [@redonkulus](https://github.com/redonkulus)
* [@zeikjt](https://github.com/zeikjt)

## License
This software is free to use under the Yahoo Inc. BSD license. See the [LICENSE file](https://github.com/yahoo/fluxible-action-utils/blob/master/LICENSE.md) for license text and copyright information.
