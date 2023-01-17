import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';

import { translate } from '../../../base/i18n/functions';
import { IconCloseLarge } from '../../../base/icons/svg';
import { connect } from '../../../base/redux/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import AbstractMessageRecipient, {
    IProps,
    _mapDispatchToProps,
    _mapStateToProps
} from '../AbstractMessageRecipient';

const styles = (theme: Theme) => {
    return {
        container: {
            margin: '0 16px 8px',
            padding: '6px',
            paddingLeft: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.palette.support05,
            borderRadius: theme.shape.borderRadius,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01
        },

        iconButton: {
            padding: '2px',

            '&:hover': {
                backgroundColor: theme.palette.action03
            }
        }
    };
};

/**
 * Class to implement the displaying of the recipient of the next message.
 */
class MessageRecipient extends AbstractMessageRecipient<IProps> {
    /**
     * Initializes a new {@code MessageRecipient} instance.
     *
     * @param {IProps} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent) {
        if (
            (this.props._onRemovePrivateMessageRecipient || this.props._onHideLobbyChatRecipient)
                && (e.key === ' ' || e.key === 'Enter')
        ) {
            e.preventDefault();
            if (this.props._isLobbyChatActive && this.props._onHideLobbyChatRecipient) {
                this.props._onHideLobbyChatRecipient();
            } else if (this.props._onRemovePrivateMessageRecipient) {
                this.props._onRemovePrivateMessageRecipient();
            }
        }
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _privateMessageRecipient, _isLobbyChatActive,
            _lobbyMessageRecipient, _visible } = this.props;

        if ((!_privateMessageRecipient && !_isLobbyChatActive) || !_visible) {
            return null;
        }

        const { classes, t } = this.props;

        return (
            <div
                className = { classes.container }
                id = 'chat-recipient'
                role = 'alert'>
                <span>
                    { t(_isLobbyChatActive ? 'chat.lobbyChatMessageTo' : 'chat.messageTo', {
                        recipient: _isLobbyChatActive ? _lobbyMessageRecipient : _privateMessageRecipient
                    }) }
                </span>
                <Button
                    accessibilityLabel = { t('dialog.close') }
                    className = { classes.iconButton }
                    icon = { IconCloseLarge }
                    onClick = { _isLobbyChatActive
                        ? this.props._onHideLobbyChatRecipient : this.props._onRemovePrivateMessageRecipient }
                    onKeyPress = { this._onKeyPress }
                    type = { BUTTON_TYPES.TERTIARY } />
            </div>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(
    withStyles(styles)(MessageRecipient)));
