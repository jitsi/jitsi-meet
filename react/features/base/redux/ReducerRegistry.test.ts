import { AnyAction, Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import ReducerRegistry from './ReducerRegistry';

describe('ReducerRegistry Unit Tests', () => {
    it('registers a reducer under a specific key', () => {
        interface ITestState {
            value: number;
        }

        const dummyReducer: Reducer<ITestState, AnyAction> = (state = { value: 0 }, action) => {
            if (action.type === 'INCREMENT') {
                return { value: state.value + 1 };
            }

            return state;
        };

        ReducerRegistry.register('test/dummy', dummyReducer);
        expect(ReducerRegistry._elements['test/dummy']).toBe(dummyReducer);
    });

    it('combines registered reducers into a single root reducer', () => {
        interface ICounterState {
            count: number;
        }

        const counterReducer: Reducer<ICounterState, AnyAction> = (state = { count: 10 }, action) => {
            if (action.type === 'ADD') {
                return { count: state.count + action.amount };
            }

            return state;
        };

        ReducerRegistry.register('test/counter', counterReducer);

        const rootReducer = ReducerRegistry.combineReducers();

        expect(typeof rootReducer).toBe('function');

        const initialState = rootReducer(undefined, { type: '@@INIT' });

        expect(initialState['test/counter']).toBeDefined();
        expect(initialState['test/counter'].count).toBe(10);

        const updatedState = rootReducer(initialState, { amount: 5, type: 'ADD' });

        expect(updatedState['test/counter'].count).toBe(15);
    });

    it('supports combining additional ad-hoc reducers', () => {
        interface IExtraState {
            extra: boolean;
        }

        const additionalReducer: Reducer<IExtraState, AnyAction> = (state = { extra: true }, action) => {
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
