// @flow

import Tooltip from '@atlaskit/tooltip';
import React from 'react';

import { translate } from '../../../base/i18n';
import { IconExclamationTriangle } from '../../../base/icons/svg';
import { Label } from '../../../base/label';
import { COLORS } from '../../../base/label/constants';
import { connect } from '../../../base/redux';
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
    _render() {
        return (
            <Tooltip
                content = { this.props.t('security.insecureRoomNameWarning') }
                position = 'bottom'>
                <Label
                    color = { COLORS.red }
                    icon = { IconExclamationTriangle } />
            </Tooltip>
        );
    }
}

export default translate(connect(_mapStateToProps)(InsecureRoomNameLabel));
