// @flow

import React from 'react';

import { IconWarning } from '../../../base/icons';
import { CircularLabel } from '../../../base/label';
import { connect } from '../../../base/redux';

import AbstractInsecureRoomNameLabel, { _mapStateToProps } from '../AbstractInsecureRoomNameLabel';

import styles from './styles';

/**
 * Renders a label indicating that we are in a room with an insecure name.
 */
class InsecureRoomNameLabel extends AbstractInsecureRoomNameLabel {
    /**
     * Renders the platform dependant content.
     *
     * @inheritdoc
     */
    _render() {
        return (
            <CircularLabel
                icon = { IconWarning }
                style = { styles.insecureRoomNameLabel } />
        );
    }
}

export default connect(_mapStateToProps)(InsecureRoomNameLabel);
