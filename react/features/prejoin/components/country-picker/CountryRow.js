// @flow

import React, { PureComponent } from 'react';

type Props = {

    /**
     * Country of the entry.
     */
    country: { name: string, dialCode: string, code: string },

    /**
     * Entry click handler.
     */
    onEntryClick: Function,
};

/**
 * This component displays a row from the country picker dropdown.
 */
class CountryRow extends PureComponent<Props> {
    /**
     * Initializes a new {@code CountryRow} instance.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            country: { code, dialCode, name }
        } = this.props;

        return (
            <div
                className = 'cpick-dropdown-entry'
                onClick = { this._onClick }>
                <div className = { `prejoin-dialog-flag iti-flag ${code}` } />
                <div className = 'cpick-dropdown-entry-text'>
                    {`${name} (+${dialCode})`}
                </div>
            </div>
        );
    }

    _onClick: () => void;

    /**
     * Click handler.
     *
     * @returns {void}
     */
    _onClick() {
        this.props.onEntryClick(this.props.country);
    }
}

export default CountryRow;
