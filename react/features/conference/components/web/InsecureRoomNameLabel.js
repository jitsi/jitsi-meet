// @flow

import Tooltip from '@atlaskit/tooltip';
import React from 'react';

import { translate } from '../../../base/i18n';
import { IconWarning } from '../../../base/icons';
import { Label } from '../../../base/label';
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
                    className = 'label--red'
                    icon = { IconWarning } />
            </Tooltip>
        );
    }
}

export default translate(connect(_mapStateToProps)(InsecureRoomNameLabel));
