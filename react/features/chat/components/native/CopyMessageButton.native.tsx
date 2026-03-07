import { Share } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconCopy } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { IMessage } from '../../types';
import Clipboard from '@react-native-clipboard/clipboard';

export interface IProps extends AbstractButtonProps {

    /**
     * The message to be copied.
     */
    message: IMessage;
}

class CopyMessageButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'chat.copyMessage';
    override icon = IconCopy;
    override label = 'chat.copyMessage';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { message } = this.props;

        Clipboard.setString(message.message)
    }
}

export default translate(connect()(CopyMessageButton));
