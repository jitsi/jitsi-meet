// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { toggleChat } from '../../../chat';

type Props = {

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function Header({ onCancel, t }: Props) {
    return (
        <div
            className = 'chat-dialog-header'>
            { t('chat.title') }
            <Icon
                onClick = { onCancel }
                src = { IconClose } />
        </div>
    );
}

const mapDispatchToProps = { onCancel: toggleChat };

export default translate(connect(null, mapDispatchToProps)(Header));
