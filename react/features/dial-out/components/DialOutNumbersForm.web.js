import { StatelessDropdownMenu } from '@atlaskit/dropdown-menu';
import ExpandIcon from '@atlaskit/icon/glyph/expand';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';

import { updateDialOutCodes } from '../actions';
import CountryIcon from './CountryIcon';

/**
 * The default value of the country if the fetch service is unavailable.
 *
 * @type {{
 *     code: string,
 *     dialCode: string,
 *     name: string
 * }}
 */
const DEFAULT_COUNTRY = {
    code: 'US',
    dialCode: '+1',
    name: 'United States'
};

/**
 * React {@code Component} responsible for fetching and displaying dial-out
 * country codes, as well as dialing a phone number.
 *
 * @extends Component
 */
class DialOutNumbersForm extends Component {
    /**
     * {@code DialOutNumbersForm}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux state representing the list of dial-out codes.
         */
        _dialOutCodes: React.PropTypes.array,

        /**
         * The function called on every dial input change.
         */
        onChange: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

        /**
         * Invoked to send an ajax request for dial-out codes.
         */
        updateDialOutCodes: React.PropTypes.func
    };

    /**
     * Initializes a new {@code DialOutNumbersForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            dialInput: '',

            /**
             * Whether or not the dropdown should be open.
             *
             * @type {boolean}
             */
            isDropdownOpen: false,

            /**
             * The selected country.
             *
             * @type {Object}
             */
            selectedCountry: DEFAULT_COUNTRY
        };

        /**
         * The internal reference to the DOM/HTML element backing the React
         * {@code Component} text input.
         *
         * @private
         * @type {HTMLInputElement}
         */
        this._dialInputElem = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onInputChange = this._onInputChange.bind(this);
        this._onOpenChange = this._onOpenChange.bind(this);
        this._onSelect = this._onSelect.bind(this);
        this._setDialInputElement = this._setDialInputElement.bind(this);
    }

    /**
     * Dispatches a request for dial out codes if not already present in the
     * redux store. If dial out codes are present, sets a default code to
     * display in the dropdown trigger.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const dialOutCodes = this.props._dialOutCodes;

        if (dialOutCodes) {
            this._setDefaultCode(dialOutCodes);
        } else {
            this.props.updateDialOutCodes();
        }
    }

    /**
     * Monitors for dial out code updates and sets a default code to display in
     * the dropdown trigger if not already set.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        if (!this.state.selectedCountry && nextProps._dialOutCodes) {
            this._setDefaultCode(nextProps._dialOutCodes);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, _dialOutCodes } = this.props;
        const items
            = _dialOutCodes ? this._formatCountryCodes(_dialOutCodes) : [];

        return (
            <div className = 'form-control'>
                { this._createDropdownMenu(items) }
                <div className = 'dial-out-input'>
                    <input
                        autoFocus = { true }
                        className = 'input-control'
                        onChange = { this._onInputChange }
                        placeholder = { t('dialOut.enterPhone') }
                        ref = { this._setDialInputElement }
                        type = 'text' />
                </div>
            </div>
        );
    }

    /**
     * Creates a {@code StatelessDropdownMenu} instance.
     *
     * @param {Array} items - The content to display within the dropdown.
     * @returns {ReactElement}
     */
    _createDropdownMenu(items) {
        const { code, dialCode } = this.state.selectedCountry;

        return (
            <StatelessDropdownMenu
                isOpen = { this.state.isDropdownOpen }
                items = { [ { items } ] }
                onItemActivated = { this._onSelect }
                onOpenChange = { this._onOpenChange }
                shouldFitContainer = { true }>
                { this._createDropdownTrigger(dialCode, code) }
            </StatelessDropdownMenu>
        );
    }

    /**
     * Creates a React {@code Component} with a readonly HTMLInputElement as a
     * trigger for displaying the dropdown menu. The {@code Component} will also
     * display the currently selected number.
     *
     * @param {string} dialCode - The +xx dial code.
     * @param {string} countryCode - The country 2 letter code.
     * @private
     * @returns {ReactElement}
     */
    _createDropdownTrigger(dialCode, countryCode) {
        return (
            <div className = 'dropdown'>
                <CountryIcon
                    className = 'dial-out-flag-icon'
                    countryCode = { `${countryCode}` } />
                <input
                    className = 'input-control dial-out-code'
                    readOnly = { true }
                    type = 'text'
                    value = { dialCode || '' } />
                <span className = 'dropdown-trigger-icon'>
                    <ExpandIcon
                        label = 'expand'
                        size = 'medium' />
                </span>
            </div>
        );
    }

    /**
     * Transforms the passed in numbers object into an array of objects that can
     * be parsed by {@code StatelessDropdownMenu}.
     *
     * @param {Object} countryCodes - The list of country codes.
     * @private
     * @returns {Array<Object>}
     */
    _formatCountryCodes(countryCodes) {
        return countryCodes.map(country => {
            const countryIcon
                = <CountryIcon countryCode = { `${country.code}` } />;
            const countryElement
                = <span>{countryIcon} { country.name }</span>;

            return {
                content: `${country.dialCode}`,
                country,
                elemBefore: countryElement
            };
        });
    }

    /**
     * Updates the dialNumber when changes to the dial text or code happen.
     *
     * @private
     * @returns {void}
     */
    _onDialNumberChange() {
        const { dialCode } = this.state.selectedCountry;

        this.props.onChange(dialCode, this.state.dialInput);
    }

    /**
     * Updates the dialInput state when the input changes.
     *
     * @param {Object} e - The event notifying us of the change.
     * @private
     * @returns {void}
     */
    _onInputChange(e) {
        this.setState({
            dialInput: e.target.value
        }, () => {
            this._onDialNumberChange();
        });
    }

    /**
     * Sets the internal state to either open or close the dropdown. If the
     * dropdown is disabled, the state will always be set to false.
     *
     * @param {Object} dropdownEvent - The even returned from clicking on the
     * dropdown trigger.
     * @private
     * @returns {void}
     */
    _onOpenChange(dropdownEvent) {
        this.setState({
            isDropdownOpen: dropdownEvent.isOpen
        });
    }

    /**
     * Updates the internal state of the currently selected country code.
     *
     * @param {Object} selection - Event from choosing an dropdown option.
     * @private
     * @returns {void}
     */
    _onSelect(selection) {
        this.setState({
            isDropdownOpen: false,
            selectedCountry: selection.item.country
        }, () => {
            this._onDialNumberChange();

            this._dialInputElem.focus();
        });
    }

    /**
     * Updates the internal state of the currently selected number by defaulting
     * to the first available number.
     *
     * @param {Object} countryCodes - The list of country codes to choose from
     * for setting a default code.
     * @private
     * @returns {void}
     */
    _setDefaultCode(countryCodes) {
        this.setState({
            selectedCountry: countryCodes[0]
        });
    }

    /**
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} dial input.
     *
     * @param {HTMLInputElement} input - The DOM/HTML element for this
     * {@code Component}'s text input.
     * @private
     * @returns {void}
     */
    _setDialInputElement(input) {
        this._dialInputElem = input;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code DialOutNumbersForm}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialOutCodes: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    const { dialOutCodes } = state['features/dial-out'];

    return {
        _dialOutCodes: dialOutCodes
    };
}

export default translate(
    connect(_mapStateToProps, { updateDialOutCodes })(DialOutNumbersForm));
