// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { PureComponent } from 'react';

import { connect } from '../../../base/redux';
import { setDialOutCountry, setDialOutNumber } from '../../actions';
import { getDialOutCountry, getDialOutNumber } from '../../functions';
import { getCountryFromDialCodeText } from '../../utils';

import CountryDropDown from './CountryDropdown';
import CountrySelector from './CountrySelector';

const PREFIX_REG = /^(00)|\+/;

type Props = {

    /**
     * The country to dial out to.
     */
    dialOutCountry: { name: string, dialCode: string, code: string },

    /**
     * The number to dial out to.
     */
    dialOutNumber: string,

    /**
     * Handler used when user presses 'Enter'.
     */
    onSubmit: Function,

    /**
     * Sets the dial out number.
     */
    setDialOutNumber: Function,

    /**
     * Sets the dial out country.
     */
    setDialOutCountry: Function,
};

type State = {

    /**
     * If the country picker is open or not.
     */
    isOpen: boolean,

    /**
     * The value of the input.
     */
    value: string
}

/**
 * This component displays a country picker with an input for the phone number.
 */
class CountryPicker extends PureComponent<Props, State> {
    /**
     * A React ref to the HTML element containing the {@code input} instance.
     */
    inputRef: Object;

    /**
     * Initializes a new {@code CountryPicker} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            value: ''
        };
        this.inputRef = React.createRef();
        this._onChange = this._onChange.bind(this);
        this._onDropdownClose = this._onDropdownClose.bind(this);
        this._onCountrySelectorClick = this._onCountrySelectorClick.bind(this);
        this._onEntryClick = this._onEntryClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
    }


    /**
     * Implements React's {@link Component#componentDidUnmount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.inputRef.current.focus();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { dialOutCountry, dialOutNumber } = this.props;
        const { isOpen } = this.state;
        const {
            inputRef,
            _onChange,
            _onCountrySelectorClick,
            _onDropdownClose,
            _onKeyPress,
            _onEntryClick
        } = this;

        return (
            <div className = 'cpick-container'>
                <InlineDialog
                    content = { <CountryDropDown onEntryClick = { _onEntryClick } /> }
                    isOpen = { isOpen }
                    onClose = { _onDropdownClose }>
                    <div className = 'cpick'>
                        <CountrySelector
                            country = { dialOutCountry }
                            onClick = { _onCountrySelectorClick } />
                        <input
                            className = 'cpick-input'
                            onChange = { _onChange }
                            onKeyPress = { _onKeyPress }
                            ref = { inputRef }
                            value = { dialOutNumber } />
                    </div>
                </InlineDialog>
            </div>
        );
    }

    _onChange: (Object) => void;

    /**
     * Handles the input text change.
     * Automatically updates the country from the 'CountrySelector' if a
     * phone number prefix is entered (00 or +).
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onChange({ target: { value } }) {
        if (PREFIX_REG.test(value)) {
            const textWithDialCode = value.replace(PREFIX_REG, '');

            if (textWithDialCode.length >= 4) {
                const country = getCountryFromDialCodeText(textWithDialCode);

                if (country) {
                    const rest = textWithDialCode.replace(country.dialCode, '');

                    this.props.setDialOutCountry(country);
                    this.props.setDialOutNumber(rest);

                    return;
                }
            }
        }

        this.props.setDialOutNumber(value);
    }

    _onCountrySelectorClick: (Object) => void;

    /**
     * Click handler for country selector.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onCountrySelectorClick(e) {
        e.stopPropagation();

        this.setState({
            isOpen: !this.setState.isOpen
        });
    }

    _onDropdownClose: () => void;

    /**
     * Closes the dropdown.
     *
     * @returns {void}
     */
    _onDropdownClose() {
        this.setState({
            isOpen: false
        });
    }

    _onEntryClick: (Object) => void;

    /**
     * Click handler for a single entry from the dropdown.
     *
     * @param {Object} country - The country used for dialing out.
     * @returns {void}
     */
    _onEntryClick(country) {
        this.props.setDialOutCountry(country);
        this._onDropdownClose();
    }

    _onKeyPress: (Object) => void;

    /**
     * Handler for key presses.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onKeyPress(e) {
        if (e.key === 'Enter') {
            this.props.onSubmit();
        }
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Props}
 */
function mapStateToProps(state) {
    return {
        dialOutCountry: getDialOutCountry(state),
        dialOutNumber: getDialOutNumber(state)
    };
}

/**
 * Maps redux actions to the props of the component.
 *
 * @type {{
 *     setDialOutCountry: Function,
 *     setDialOutNumber: Function
 * }}
 */
const mapDispatchToProps = {
    setDialOutCountry,
    setDialOutNumber
};

export default connect(mapStateToProps, mapDispatchToProps)(CountryPicker);
