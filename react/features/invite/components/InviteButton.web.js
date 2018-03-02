import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@atlaskit/button';

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { AddPeopleDialog } from '.';

/**
 * The button that provides different invite options.
 */
class InviteButton extends Component {
    /**
     * {@code InviteButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to open {@code AddPeopleDialog}.
         */
        dispatch: PropTypes.func,

        /**
         * Indicates if the "Add to call" feature is available.
         */
        enableAddPeople: PropTypes.bool,

        /**
         * Indicates if the "Dial out" feature is available.
         */
        enableDialOut: PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code InviteButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'filmstrip__invite'>
                <div className = 'invite-button-group'>
                    <Button
                        onClick = { this._onClick }
                        shouldFitContainer = { true }>
                        { this.props.t('addPeople.invite') }
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Opens {@code AddPeopleDialog}.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this.props.dispatch(openDialog(AddPeopleDialog, {
            enableAddPeople: this.props.enableAddPeople,
            enableDialOut: this.props.enableDialOut
        }));
    }
}

export default translate(connect()(InviteButton));
