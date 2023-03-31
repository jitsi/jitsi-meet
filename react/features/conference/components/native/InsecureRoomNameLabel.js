// @flow

import React from 'react';
import { connect } from 'react-redux';

import { IconWarning } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import AbstractInsecureRoomNameLabel, { _mapStateToProps } from '../AbstractInsecureRoomNameLabel';

import styles from './styles';

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
            <Label
                icon = { IconWarning }
                style = { styles.insecureRoomNameLabel } />
        );
    }
}

export default connect(_mapStateToProps)(InsecureRoomNameLabel);
