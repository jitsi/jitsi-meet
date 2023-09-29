import { ComponentType } from 'react';

import { IReduxState } from '../../app/types';
import { IStateful } from '../app/types';
import ColorSchemeRegistry from '../color-scheme/ColorSchemeRegistry';
import { toState } from '../redux/functions';

/**
 * Checks if any {@code Dialog} is currently open.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export function isAnyDialogOpen(stateful: IStateful) {
    return Boolean(toState(stateful)['features/base/dialog'].component);
}

/**
 * Checks if a {@code Dialog} with a specific {@code component} is currently
 * open.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @param {React.Component} component - The {@code component} of a
 * {@code Dialog} to be checked.
 * @returns {boolean}
 */
export function isDialogOpen(stateful: IStateful, component: ComponentType<any>) {
    return toState(stateful)['features/base/dialog'].component === component;
}

/**
 * Maps part of the Redux state to the props of any Dialog based component.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {{
 *     _dialogStyles: StyleType
 * }}
 */
export function _abstractMapStateToProps(state: IReduxState) {
    return {
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}
