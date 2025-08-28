import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconExclamationTriangle } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { COLORS } from '../../../base/label/constants';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import getUnsafeRoomText from '../../../base/util/getUnsafeRoomText.web';
import AbstractInsecureRoomNameLabel, { _mapStateToProps } from '../AbstractInsecureRoomNameLabel';

/**
 * Renders a label indicating that we are in a room with an insecure name.
 */
class InsecureRoomNameLabel extends AbstractInsecureRoomNameLabel {
    /**
     * Renders the platform dependent content.
     *
     * @inheritdoc
     */
    override _render() {
        return (
            <Tooltip
                content = { getUnsafeRoomText(this.props.t, 'meeting') }
                position = 'bottom'>
                <Label
                    color = { COLORS.red }
                    icon = { IconExclamationTriangle } />
            </Tooltip>
        );
    }
}

export default translate(connect(_mapStateToProps)(InsecureRoomNameLabel));
