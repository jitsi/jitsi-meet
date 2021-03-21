// @flow

import React from 'react';

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
};

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function Header({ onCancel, className }: Props) {
    return (
        <div
            className = { className || 'chat-dialog-header' }>
            <Icon
                onClick = { onCancel }
                src = { IconClose } />
        </div>
    );
}

const mapDispatchToProps = { onCancel: toggleChat };

export default connect(null, mapDispatchToProps)(Header);
