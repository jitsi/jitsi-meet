/* @flow */

import sinon from 'sinon';

import { ReducerRegistry } from '../../base/redux';

import { dismissMobileAppPromo } from '../actions';

declare var afterAll: Function;
declare var beforeAll: Function;
declare var describe: Function;
declare var expect: Function;
declare var it: Function;

let reducerObj;
let stub;

/**
 * Test suite related to unsupported browser reducer.
 */
describe('Unsupported browser reducer', () => {
    /**
     * Sets stub on reducer registry and requires reducer.
     */
    beforeAll(() => {
        stub = sinon.stub(ReducerRegistry, 'register');
        stub.callsFake((namespace, reducer) => {
            reducerObj = {
                namespace,
                reducer
            };
        });

        // Requiring reducer after stub has been set.
        require('../reducer');
    });

    /**
     * Restoring reducer registry.
     */
    afterAll(() => {
        stub.restore();
    });

    /**
     * Checks whether register method of reducer registry was called.
     */
    it('should call reducer registry register method', () => {
        expect(stub.called).toBeTruthy();
    });

    /**
     *  Checks whether reducer is registered on correct namespace.
     */
    it('should register reducer on correct namespace', () => {
        const namespace = 'features/unsupported-browser';

        expect(reducerObj.namespace).toContain(namespace);
    });

    /**
     * Checks whether reducer returns initial state if state is not passed.
     */
    it('should return initial state if state is not passed', () => {
        const { reducer } = reducerObj;
        const state = reducer(undefined, {});

        expect(state).toBeDefined();
    });

    /**
     * Checks whether reducer returns non modified state if action is not
     * supported by the reducer.
     */
    it('should return non modified state if action is not supported', () => {
        const { reducer } = reducerObj;
        const state = { test: 'test' };
        const newState = reducer(state, {
            type: Symbol('SOME_OTHER_ACTION')
        });

        expect(newState).toBe(state);
    });

    /**
     * Checks that dismiss mobile app promo sets the value in the redux store.
     */
    it('should set mobile app promo dismissed property in store', () => {
        const { reducer } = reducerObj;
        const newState = reducer({}, dismissMobileAppPromo());

        expect(newState).toEqual(expect.objectContaining({
            mobileAppPromoDismissed: true
        }));
    });
});
