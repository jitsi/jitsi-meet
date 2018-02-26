import DropdownMenu, {
    DropdownItem,
    DropdownItemGroup
} from '@atlaskit/dropdown-menu';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { DEFAULT_LANGUAGE, LANGUAGES, translate } from '../../../base/i18n';

/**
 * Implements a React {@link Component} which displays a dropdown for changing
 * application text to another language.
 *
 * @extends Component
 */
class LanguageSelectDropdown extends Component {
    /**
     * {@code LanguageSelectDropdown} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The translation service.
         */
        i18n: PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };


    /**
     * {@code LanguageSelectDropdown} component's local state.
     *
     * @type {Object}
     * @property {string|null} currentLanguage - The currently selected language
     * the application should be displayed in.
     * @property {boolean} isLanguageSelectOpen - Whether or not the dropdown
     * should be displayed as open.
     */
    state = {
        currentLanguage: null,
        isLanguageSelectOpen: false
    };

    /**
     * Initializes a new {@code LanguageSelectDropdown} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state.currentLanguage
            = this.props.i18n.language || DEFAULT_LANGUAGE;

        // Bind event handlers so they are only bound once for every instance.
        this._onLanguageSelected = this._onLanguageSelected.bind(this);
        this._onSetDropdownOpen = this._onSetDropdownOpen.bind(this);
        this._setCurrentLanguage = this._setCurrentLanguage.bind(this);
    }

    /**
     * Sets a listener to update the currently selected language if it is
     * changed from somewhere else.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this.props.i18n.on('languageChanged', this._setCurrentLanguage);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this.props.i18n.off('languageChanged', this._setCurrentLanguage);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;
        const { currentLanguage } = this.state;

        const languageItems = LANGUAGES.map(language =>
            // eslint-disable-next-line react/jsx-wrap-multilines
            <DropdownItem
                key = { language }
                // eslint-disable-next-line react/jsx-no-bind
                onClick = { () => this._onLanguageSelected(language) }>
                { t(`languages:${language}`) }
            </DropdownItem>
        );

        return (
            <div>
                <DropdownMenu
                    isOpen = { this.state.isLanguageSelectOpen }
                    onOpenChange = { this._onSetDropdownOpen }
                    shouldFitContainer = { true }
                    trigger = { currentLanguage
                        ? t(`languages:${currentLanguage}`)
                        : '' }
                    triggerButtonProps = {{
                        appearance: 'primary',
                        shouldFitContainer: true
                    }}
                    triggerType = 'button'>
                    <DropdownItemGroup>
                        { languageItems }
                    </DropdownItemGroup>
                </DropdownMenu>
            </div>
        );
    }

    /**
     * Updates the application's currently displayed language.
     *
     * @param {string} language - The language code for the language to display.
     * @private
     * @returns {void}
     */
    _onLanguageSelected(language) {
        const previousLanguage = this.state.currentLanguage;

        this.setState({
            currentLanguage: language,
            isLanguageSelectOpen: false
        });

        this.props.i18n.changeLanguage(language, error => {
            if (error) {
                this._setCurrentLanguage(previousLanguage);
            }
        });
    }

    /**
     * Set whether or not the dropdown should be open.
     *
     * @param {Object} dropdownEvent - The event returned from requesting the
     * open state of the dropdown be changed.
     * @private
     * @returns {void}
     */
    _onSetDropdownOpen(dropdownEvent) {
        this.setState({
            isLanguageSelectOpen: dropdownEvent.isOpen
        });
    }

    /**
     * Updates the known current language of the application.
     *
     * @param {string} currentLanguage - The language code for the current
     * language.
     * @private
     * @returns {void}
     */
    _setCurrentLanguage(currentLanguage) {
        this.setState({ currentLanguage });
    }
}

export default translate(LanguageSelectDropdown);
