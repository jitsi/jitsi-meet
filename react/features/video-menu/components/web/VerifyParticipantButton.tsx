import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconCheck } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { startVerification } from '../../../e2ee/actions';

/**
 * The type of the React {@code Component} props of
 * {@link VerifyParticipantButton}.
 */
interface IProps extends WithTranslation {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function;

    /**
      * The ID of the participant that this button is supposed to verified.
      */
    participantID: string;
}

const styles = () => {
    return {
        triggerButton: {
            padding: '3px !important',
            borderRadius: '4px'
        },

        contextMenu: {
            position: 'relative' as const,
            marginTop: 0,
            right: 'auto',
            marginRight: '4px',
            marginBottom: '4px'
        }
    };
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code VideoMenu}.
 *
 * @augments {Component}
 */
class VerifyParticipantButton extends Component<IProps> {

    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { participantID, t } = this.props;

        return (
            <ContextMenuItem
                accessibilityLabel = { t('videothumbnail.verify') }
                className = 'verifylink'
                icon = { IconCheck }
                id = { `verifylink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('videothumbnail.verify') } />
        );
    }

    /**
     * Handles clicking / pressing the button, and starts the participant verification process.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(startVerification(participantID));
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { participantID } = ownProps;

    return {
        _participantID: participantID
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(VerifyParticipantButton)));
