import { StatelessDropdownMenu } from '@atlaskit/dropdown-menu';
import ExpandIcon from '@atlaskit/icon/glyph/expand';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';

import { updateDialInNumbers } from '../actions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

const EXPAND_ICON = <ExpandIcon label = 'expand' />;

/**
 * React {@code Component} responsible for fetching and displaying telephone
 * numbers for dialing into the conference. Also supports copying a selected
 * dial-in number to the clipboard.
 *
 * @extends Component
 */
class DialInNumbersForm extends Component {
    /**
     * {@code DialInNumbersForm}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux state representing the dial-in numbers feature.
         */
        _dialIn: React.PropTypes.object,

        /**
         * The url for retrieving dial-in numbers.
         */
        dialInNumbersUrl: React.PropTypes.string,

        /**
         * Invoked to send an ajax request for dial-in numbers.
         */
        dispatch: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new {@code DialInNumbersForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the dropdown should be open.
             *
             * @type {boolean}
             */
            isDropdownOpen: false,

            /**
             * The dial-in number to display as currently selected in the
             * dropdown. The value should be an object which has two key/value
             * pairs, content and number. The value of "content" will display in
             * the dropdown while the value of "number" is a substring of
             * "content" which will be copied to clipboard.
             *
             * @type {object}
             */
            selectedNumber: null
        };

        /**
         * The internal reference to the DOM/HTML element backing the React
         * {@code Component} input. It is necessary for the implementation of
         * copying to the clipboard.
         *
         * @private
         * @type {HTMLInputElement}
         */
        this._inputElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onOpenChange = this._onOpenChange.bind(this);
        this._onSelect = this._onSelect.bind(this);
        this._setInput = this._setInput.bind(this);
    }

    /**
     * Dispatches a request for numbers if not already present in the redux
     * store. If numbers are present, sets a default number to display in the
     * dropdown trigger.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        if (this.props._dialIn.numbers) {
            this._setDefaultNumber(this.props._dialIn.numbers);
        } else {
            this.props.dispatch(
                updateDialInNumbers(this.props.dialInNumbersUrl));
        }
    }

    /**
     * Monitors for number updates and sets a default number to display in the
     * dropdown trigger if not already set.
     *
     * @inheritdoc
     * returns {void}
     */
    componentWillReceiveProps(nextProps) {
        if (!this.state.selectedNumber && nextProps._dialIn.numbers) {
            this._setDefaultNumber(nextProps._dialIn.numbers);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, _dialIn } = this.props;

        const numbers = _dialIn.numbers;
        const items = numbers ? this._formatNumbers(numbers) : [];

        const isEnabled = this._isDropdownEnabled();
        const inputWrapperClassNames
            = `form-control__container ${isEnabled ? '' : 'is-disabled'}
                ${_dialIn.loading ? 'is-loading' : ''}`;

        let triggerText = '';

        if (!_dialIn.numbersEnabled) {
            triggerText = t('invite.numbersDisabled');
        } else if (this.state.selectedNumber
            && this.state.selectedNumber.content) {
            triggerText = this.state.selectedNumber.content;
        } else if (!numbers && _dialIn.loading) {
            triggerText = t('invite.loadingNumbers');
        } else if (_dialIn.error) {
            triggerText = t('invite.errorFetchingNumbers');
        } else {
            triggerText = t('invite.noNumbers');
        }

        return (
            <div className = 'form-control dial-in-numbers'>
                <label className = 'form-control__label'>
                    { t('invite.dialInNumbers') }
                </label>
                <div className = { inputWrapperClassNames }>
                    { this._createDropdownMenu(items, triggerText) }
                    <button
                        className = 'button-control button-control_light'
                        disabled = { !isEnabled }
                        onClick = { this._onClick }
                        type = 'button'>
                        Copy
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Creates a {@code StatelessDropdownMenu} instance.
     *
     * @param {Array} items - The content to display within the dropdown.
     * @param {string} triggerText - The text to display within the
     * trigger element.
     * @returns {ReactElement}
     */
    _createDropdownMenu(items, triggerText) {
        return (
            <StatelessDropdownMenu
                isOpen = { this.state.isDropdownOpen }
                items = { [ { items } ] }
                onItemActivated = { this._onSelect }
                onOpenChange = { this._onOpenChange }
                shouldFitContainer = { true }>
                { this._createDropdownTrigger(triggerText) }
            </StatelessDropdownMenu>
        );
    }

    /**
     * Creates a React {@code Component} with a redonly HTMLInputElement as a
     * trigger for displaying the dropdown menu. The {@code Component} will also
     * display the currently selected number.
     *
     * @param {string} triggerText - Text to display in the HTMLInputElement.
     * @private
     * @returns {ReactElement}
     */
    _createDropdownTrigger(triggerText) {
        return (
            <div className = 'dial-in-numbers-trigger'>
                <input
                    className = 'input-control'
                    readOnly = { true }
                    ref = { this._setInput }
                    type = 'text'
                    value = { triggerText || '' } />
                <span className = 'dial-in-numbers-trigger-icon'>
                    { EXPAND_ICON }
                </span>
            </div>
        );
    }

    /**
     * Detects whether the response from dialInNumbersUrl returned an array or
     * an object with dial-in numbers and calls the appropriate method to
     * transform the numbers into the format expected by
     * {@code StatelessDropdownMenu}.
     *
     * @param {Array<string>|Object} dialInNumbers - The numbers returned from
     * requesting dialInNumbersUrl.
     * @private
     * @returns {Array<Object>}
     */
    _formatNumbers(dialInNumbers) {
        if (Array.isArray(dialInNumbers)) {
            return this._formatNumbersArray(dialInNumbers);
        }

        return this._formatNumbersObject(dialInNumbers);
    }

    /**
     * Transforms the passed in numbers array into an array of objects that can
     * be parsed by {@code StatelessDropdownMenu}.
     *
     * @param {Array<string>} dialInNumbers - An array with dial-in numbers to
     * display and copy.
     * @private
     * @returns {Array<Object>}
     */
    _formatNumbersArray(dialInNumbers) {
        return dialInNumbers.map(number => {
            return {
                content: number,
                number
            };
        });
    }

    /**
     * Transforms the passed in numbers object into an array of objects that can
     * be parsed by {@code StatelessDropdownMenu}.
     *
     * @param {Object} dialInNumbers - The numbers object to parse. The
     * expected format is an object with keys being the name of the country
     * and the values being an array of numbers as strings.
     * @private
     * @returns {Array<Object>}
     */
    _formatNumbersObject(dialInNumbers) {
        const phoneRegions = Object.keys(dialInNumbers);

        if (!phoneRegions.length) {
            return [];
        }

        const formattedNumbeers = phoneRegions.map(region => {
            const numbers = dialInNumbers[region];

            return numbers.map(number => {
                return {
                    content: `${region}: ${number}`,
                    number
                };
            });
        });

        return Array.prototype.concat(...formattedNumbeers);
    }

    /**
     * Determines if the dropdown can be opened.
     *
     * @private
     * @returns {boolean} True if the dropdown can be opened.
     */
    _isDropdownEnabled() {
        const { selectedNumber } = this.state;

        return Boolean(
            this.props._dialIn.numbersEnabled
            && selectedNumber
            && selectedNumber.content
        );
    }

    /**
     * Copies part of the number displayed in the dropdown trigger into the
     * clipboard. Only the value specified in selectedNumber.number, which
     * should be a substring of the displayed value, will be copied.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const displayedValue = this.state.selectedNumber.content;
        const desiredNumber = this.state.selectedNumber.number;
        const startIndex = displayedValue.indexOf(desiredNumber);

        try {
            this._input.focus();
            this._input.setSelectionRange(startIndex, displayedValue.length);
            document.execCommand('copy');
            this._input.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
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
            isDropdownOpen: this._isDropdownEnabled() && dropdownEvent.isOpen
        });
    }

    /**
     * Updates the internal state of the currently selected number.
     *
     * @param {Object} selection - Event from choosing an dropdown option.
     * @private
     * @returns {void}
     */
    _onSelect(selection) {
        this.setState({
            isDropdownOpen: false,
            selectedNumber: selection.item
        });
    }

    /**
     * Updates the internal state of the currently selected number by defaulting
     * to the first available number.
     *
     * @param {Object} dialInNumbers - The array or object of numbers to parse.
     * @private
     * @returns {void}
     */
    _setDefaultNumber(dialInNumbers) {
        const numbers = this._formatNumbers(dialInNumbers);

        this.setState({
            selectedNumber: numbers[0]
        });
    }

    /**
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} input.
     *
     * @param {HTMLInputElement} element - The DOM/HTML element for this
     * {@code Component}'s input.
     * @private
     * @returns {void}
     */
    _setInput(element) {
        this._input = element;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code DialInNumbersForm}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialIn: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _dialIn: state['features/invite/dial-in']
    };
}

export default translate(connect(_mapStateToProps)(DialInNumbersForm));
