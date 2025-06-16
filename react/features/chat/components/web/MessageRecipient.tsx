import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconCloseLarge } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import {
    IProps,
    _mapDispatchToProps,
    _mapStateToProps
} from '../AbstractMessageRecipient';

const useStyles = makeStyles()(theme => {
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

        text: {
            maxWidth: 'calc(100% - 30px)',
            overflow: 'hidden',
            whiteSpace: 'break-spaces',
            wordBreak: 'break-all'
        },

        iconButton: {
            padding: '2px',

            '&:hover': {
                backgroundColor: theme.palette.action03
            }
        }
    };
});

const MessageRecipient = ({
    _privateMessageRecipient,
    _isLobbyChatActive,
    _lobbyMessageRecipient,
    _onRemovePrivateMessageRecipient,
    _onHideLobbyChatRecipient,
    _visible
}: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    const _onKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (
            (_onRemovePrivateMessageRecipient || _onHideLobbyChatRecipient)
            && (e.key === ' ' || e.key === 'Enter')
        ) {
            e.preventDefault();
            if (_isLobbyChatActive && _onHideLobbyChatRecipient) {
                _onHideLobbyChatRecipient();
            } else if (_onRemovePrivateMessageRecipient) {
                _onRemovePrivateMessageRecipient();
            }
        }
    }, [ _onRemovePrivateMessageRecipient, _onHideLobbyChatRecipient, _isLobbyChatActive ]);

    if ((!_privateMessageRecipient && !_isLobbyChatActive) || !_visible) {
        return null;
    }

    return (
        <div
            className = { classes.container }
            id = 'chat-recipient'
            role = 'alert'>
            <span className = { classes.text }>
                {t(_isLobbyChatActive ? 'chat.lobbyChatMessageTo' : 'chat.messageTo', {
                    recipient: _isLobbyChatActive ? _lobbyMessageRecipient : _privateMessageRecipient
                })}
            </span>
            <Button
                accessibilityLabel = { t('dialog.close') }
                className = { classes.iconButton }
                icon = { IconCloseLarge }
                onClick = { _isLobbyChatActive
                    ? _onHideLobbyChatRecipient : _onRemovePrivateMessageRecipient }
                onKeyPress = { _onKeyPress }
                type = { BUTTON_TYPES.TERTIARY } />
        </div>
    );
};

export default connect(_mapStateToProps, _mapDispatchToProps)(MessageRecipient);
