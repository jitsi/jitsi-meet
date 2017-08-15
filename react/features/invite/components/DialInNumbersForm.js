import Button from '@atlaskit/button';
import { StatelessDropdownMenu } from '@atlaskit/dropdown-menu';
import { FieldText } from '@atlaskit/field-text';
import ExpandIcon from '@atlaskit/icon/glyph/expand';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getLocalParticipant } from '../../base/participants';

import { updateDialInNumbers } from '../actions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * React {@code Component} responsible for fetching and displaying telephone
 * numbers for dialing into a conference. Also supports copying a selected
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
         * The display name of the local user.
         */
        _localUserDisplayName: React.PropTypes.string,

        /**
         * Invoked to send an ajax request for dial-in numbers.
         */
        dispatch: React.PropTypes.func,

        /**
         * The URL of the conference into which this {@code DialInNumbersForm}
         * is inviting the local participant.
         */
        inviteURL: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

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
         * {@code Component} text area. It is necessary for the implementation
         * of copying to the clipboard.
         *
         * @private
         * @type {HTMLTextAreaElement}
         */
        this._copyElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onCopyClick = this._onCopyClick.bind(this);
        this._onDropdownTriggerInputChange
            = this._onDropdownTriggerInputChange.bind(this);
        this._onOpenChange = this._onOpenChange.bind(this);
        this._onSelect = this._onSelect.bind(this);
        this._setCopyElement = this._setCopyElement.bind(this);
    }

    /**
     * Sets a default number to display in the dropdown trigger.
     *
     * @inheritdoc
     * returns {void}
     */
    componentWillMount() {
        const { numbers } = this.props._dialIn;

        if (numbers) {
            this._setDefaultNumber(numbers);
        } else {
            this.props.dispatch(updateDialInNumbers());
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
     * Implements React's {@link Component#render()}. Returns null if the
     * component is not ready for display.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { _dialIn, t } = this.props;
        const { conferenceID, numbers, numbersEnabled } = _dialIn;
        const { selectedNumber } = this.state;

        if (!conferenceID || !numbers || !numbersEnabled || !selectedNumber) {
            return null;
        }

        const items = this._formatNumbers(numbers);

        return (
            <div className = 'form-control dial-in-numbers'>
                <label className = 'form-control__label'>
                    { t('invite.howToDialIn') }
                    <span className = 'dial-in-numbers-conference-id'>
                        { conferenceID }
                    </span>
                </label>
                <div className = 'form-control__container'>
                    { this._createDropdownMenu(items, selectedNumber.content) }
                    <Button
                        appearance = 'default'
                        onClick = { this._onCopyClick }
                        shouldFitContainer = { true }
                        type = 'button'>
                        { t('dialog.copy') }
                    </Button>
                </div>
                <textarea
                    className = 'dial-in-numbers-copy'
                    readOnly = { true }
                    ref = { this._setCopyElement }
                    tabIndex = '-1'
                    value = { this._generateCopyText() } />
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
     * Creates a React {@code Component} with a readonly HTMLInputElement as a
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
                <div className = 'form-control__input-container'>
                    <FieldText
                        compact = { true }
                        isLabelHidden = { true }
                        isReadOnly = { true }
                        label = 'Select Dial-In Number'
                        onChange = { this._onDropdownTriggerInputChange }
                        ref = { this._setInput }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { triggerText || '' } />
                </div>
                <span className = 'dial-in-numbers-trigger-icon'>
                    <ExpandIcon
                        label = 'expand'
                        size = 'medium' />
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

        const formattedNumbers = phoneRegions.map(region => {
            const numbers = dialInNumbers[region];

            return numbers.map(number => {
                return {
                    content: `${region}: ${number}`,
                    number
                };
            });
        });

        return Array.prototype.concat(...formattedNumbers);
    }

    /**
     * Creates a message describing how to dial in to the conference.
     *
     * @private
     * @returns {string}
     */
    _generateCopyText() {
        const { t } = this.props;
        const welcome = t('invite.invitedYouTo', {
            inviteURL: this.props.inviteURL,
            userName: this.props._localUserDisplayName
        });

        const callNumber = t('invite.callNumber', {
            number: this.state.selectedNumber.number
        });
        const stepOne = `1) ${callNumber}`;

        const enterID = t('invite.enterID', {
            conferenceID: this.props._dialIn.conferenceID
        });
        const stepTwo = `2) ${enterID}`;

        return `${welcome}\n${stepOne}\n${stepTwo}`;
    }

    /**
     * Copies part of the number displayed in the dropdown trigger into the
     * clipboard. Only the value specified in selectedNumber.number, which
     * should be a substring of the displayed value, will be copied.
     *
     * @private
     * @returns {void}
     */
    _onCopyClick() {
        try {
            this._copyElement.select();
            document.execCommand('copy');
            this._copyElement.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
    }

    /**
     * This is a no-op function used to stub out FieldText's onChange in order
     * to prevent FieldText from printing prop type validation errors. FieldText
     * is used as a trigger for the dropdown in {@code DialInNumbersForm} to
     * get the desired AtlasKit input look for the UI.
     *
     * @returns {void}
     */
    _onDropdownTriggerInputChange() {
        // Intentionally left empty.
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
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} text area.
     *
     * @param {HTMLTextAreaElement} element - The DOM/HTML element for this
     * {@code Component}'s text area.
     * @private
     * @returns {void}
     */
    _setCopyElement(element) {
        this._copyElement = element;
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
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code DialInNumbersForm}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _localUserDisplayName: React.PropTypes.string,
 *     _dialIn: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _localUserDisplayName: getLocalParticipant(state).name,
        _dialIn: state['features/invite']
    };
}

export default translate(connect(_mapStateToProps)(DialInNumbersForm));
