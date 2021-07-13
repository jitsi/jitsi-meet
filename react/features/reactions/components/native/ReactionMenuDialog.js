// @flow

import React, { PureComponent } from 'react';
import { SafeAreaView, TouchableWithoutFeedback, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { hideDialog, isDialogOpen } from '../../../base/dialog';
import { getParticipantCount } from '../../../base/participants';
import { connect } from '../../../base/redux';
import type { StyleType } from '../../../base/styles';

import ReactionMenu from './ReactionMenu';

/**
 * The type of the React {@code Component} props of {@link ReactionMenuDialog}.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * True if the dialog is currently visible, false otherwise.
     */
    _isOpen: boolean,

    /**
     * The width of the screen.
     */
    _width: number,

    /**
    * The height of the screen.
    */
    _height: number,

    /**
     * Number of conference participants.
     */
    _participantCount: number,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function
};

/**
 * The exported React {@code Component}. We need it to execute
 * {@link hideDialog}.
 *
 * XXX It does not break our coding style rule to not utilize globals for state,
 * because it is merely another name for {@code export}'s {@code default}.
 */
let ReactionMenu_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class ReactionMenuDialog extends PureComponent<Props> {
    /**
     * Initializes a new {@code ReactionMenuDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _styles, _width, _height, _participantCount } = this.props;

        return (
            <SafeAreaView style = { _styles }>
                <TouchableWithoutFeedback
                    onPress = { this._onCancel }>
                    <View style = { _styles }>
                        <View
                            style = {{
                                left: (_width - 360) / 2,
                                top: _height - (_participantCount > 1 ? 144 : 80) - 80
                            }}>
                            <ReactionMenu
                                onCancel = { this._onCancel }
                                overflowMenu = { false } />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        );
    }

    _onCancel: () => boolean;

    /**
     * Hides this {@code ReactionMenuDialog}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(ReactionMenu_));

            return true;
        }

        return false;
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
        _isOpen: isDialogOpen(state, ReactionMenu_),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox').reactionDialog,
        _width: state['features/base/responsive-ui'].clientWidth,
        _height: state['features/base/responsive-ui'].clientHeight,
        _participantCount: getParticipantCount(state)
    };
}

ReactionMenu_ = connect(_mapStateToProps)(ReactionMenuDialog);

export default ReactionMenu_;
