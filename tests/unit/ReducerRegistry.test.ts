import { describe, expect, it } from 'vitest';

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
        expect(ReducerRegistry._elements['test/dummy']).toBe(dummyReducer);
    });

    it('combines registered reducers into a single root reducer', () => {
        ReducerRegistry.register('test/counter', (state: any = { count: 10 }, action: any) => {
            if (action.type === 'ADD') {
                return { count: state.count + action.amount };
            }

            return state;
        });

        const rootReducer = ReducerRegistry.combineReducers();

        expect(typeof rootReducer).toBe('function');

        const initialState = rootReducer(undefined, { type: '@@INIT' });

        expect(initialState['test/counter']).toBeDefined();
        expect(initialState['test/counter'].count).toBe(10);

        const updatedState = rootReducer(initialState, { type: 'ADD', amount: 5 });

        expect(updatedState['test/counter'].count).toBe(15);
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

        expect(initialState['test/additional']).toBeDefined();
        expect(initialState['test/additional'].extra).toBe(true);

        const updatedState = rootReducer(initialState, { type: 'TOGGLE_EXTRA' });

        expect(updatedState['test/additional'].extra).toBe(false);
    });
});
