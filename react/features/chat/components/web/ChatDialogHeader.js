// @flow

import React, { useCallback } from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { toggleChat } from '../../actions.web';

type Props = {

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function,

    /**
     * An optional class name.
     */
    className: string,

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
function Header({ onCancel, className, t }: Props) {

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, [ onCancel ]);

    return (
        <div
            className = { className || 'chat-dialog-header' }
            role = 'heading'>
            { t('chat.title') }
            <Icon
                ariaLabel = { t('toolbar.closeChat') }
                onClick = { onCancel }
                onKeyPress = { onKeyPressHandler }
                role = 'button'
                src = { IconClose }
                tabIndex = { 0 } />
        </div>
    );
}

const mapDispatchToProps = { onCancel: toggleChat };

export default translate(connect(null, mapDispatchToProps)(Header));
