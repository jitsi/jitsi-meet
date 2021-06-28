// @flow

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { REACTIONS } from '../../constants';

import RaiseHandButton from './RaiseHandButton';
import ReactionButton from './ReactionButton';

/**
 * The type of the React {@code Component} props of {@link ReactionMenu}.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * Used to close the overflow menu after raise hand is clicked.
     */
    onCancel: Function,

    /**
     * Whether or not it's displayed in the overflow menu.
     */
    overflowMenu: boolean
};

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class ReactionMenu extends PureComponent<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _styles, overflowMenu } = this.props;

        return (
            <View style = { overflowMenu ? _styles.overflowReactionMenu : _styles.reactionMenu }>
                <View style = { _styles.reactionRow }>
                    {Object.keys(REACTIONS).map(key => (
                        <ReactionButton
                            key = { key }
                            reaction = { key }
                            styles = { _styles.reactionButton } />
                    ))}
                </View>
                <RaiseHandButton onCancel = { this.props.onCancel } />
            </View>
        );
    }


}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _width: state['features/base/responsive-ui'].clientWidth
    };
}

export default connect(_mapStateToProps)(ReactionMenu);
