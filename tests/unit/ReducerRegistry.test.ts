import { describe, it } from 'node:test';
import assert from 'node:assert';

import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';

describe('ReducerRegistry Unit Tests', () => {
    it('registers a reducer under a specific key', () => {
        const dummyReducer = (state: any = { value: 0 }, action: any) => {
            if (action.type === 'INCREMENT') {
                return { value: state.value + 1 };
            }

            return state;
        };

        ReducerRegistry.register('test/dummy', dummyReducer);
        assert.strictEqual(
            ReducerRegistry._elements['test/dummy'],
            dummyReducer,
            'Reducer should be saved under the registered name'
        );
    });

    it('combines registered reducers into a single root reducer', () => {
        ReducerRegistry.register('test/counter', (state: any = { count: 10 }, action: any) => {
            if (action.type === 'ADD') {
                return { count: state.count + action.amount };
            }

            return state;
        });

        const rootReducer = ReducerRegistry.combineReducers();
        assert.strictEqual(typeof rootReducer, 'function', 'combineReducers should return a reducer function');

        const initialState = rootReducer(undefined, { type: '@@INIT' });
        assert.ok(initialState['test/counter'], 'Combined state should contain test/counter');
        assert.strictEqual(initialState['test/counter'].count, 10);

        const updatedState = rootReducer(initialState, { type: 'ADD', amount: 5 });
        assert.strictEqual(updatedState['test/counter'].count, 15);
    });

    it('supports combining additional ad-hoc reducers', () => {
        const additionalReducer = (state: any = { extra: true }, action: any) => {
            if (action.type === 'TOGGLE_EXTRA') {
                return { extra: !state.extra };
            }

            return state;
        };

        const rootReducer = ReducerRegistry.combineReducers({
            'test/additional': additionalReducer
        });

        const initialState = rootReducer(undefined, { type: '@@INIT' });
        assert.ok(initialState['test/additional'], 'Combined state should contain additional reducer');
        assert.strictEqual(initialState['test/additional'].extra, true);

        const updatedState = rootReducer(initialState, { type: 'TOGGLE_EXTRA' });
        assert.strictEqual(updatedState['test/additional'].extra, false);
    });
});
