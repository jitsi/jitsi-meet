// @flow

import React, { PureComponent } from 'react';

import { getFieldValue } from '../../../react';

type Props = {

    /**
     * If the input should be focused on display.
     */
    autoFocus?: boolean,

    /**
     * Class name to be appended to the default class list.
     */
    className?: string,

    /**
     * TestId of the button. Can be used to locate element when testing UI.
     */
    testId?: string,

    /**
     * Callback for the onChange event of the field.
     */
    onChange: Function,

    /**
     * Callback to be used when the user hits Enter in the field.
     */
    onSubmit?: Function,

    /**
     * Placeholder text for the field.
     */
    placeHolder: string,

    /**
     * The field type (e.g. text, password...etc).
     */
    type: string,

    /**
     * Externally provided value.
     */
    value?: string,
    id?: string,
    autoComplete?: string
};

type State = {

    /**
     * True if the field is focused, false otherwise.
     */
    focused: boolean,

    /**
     * The current value of the field.
     */
    value: string
}

/**
 * Implements a pre-styled input field to be used on pre-meeting screens.
 */
export default class InputField extends PureComponent<Props, State> {
    static defaultProps: {
        className: '',
        type: 'text'
    };

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            focused: false,
            value: props.value || ''
        };

        this._onBlur = this._onBlur.bind(this);
        this._onChange = this._onChange.bind(this);
        this._onFocus = this._onFocus.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    /**
     * Implements {@code PureComponent.getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: State) {
        const { value } = props;

        if (state.value !== value) {
            return {
                ...state,
                value
            };
        }

        return null;
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <input
                autoComplete = { this.props.autoComplete }
                autoFocus = { this.props.autoFocus }
                className = { `field ${this.state.focused ? 'focused' : ''} ${this.props.className || ''}` }
                data-testid = { this.props.testId ? this.props.testId : undefined }
                id = { this.props.id }
                onBlur = { this._onBlur }
                onChange = { this._onChange }
                onFocus = { this._onFocus }
                onKeyDown = { this._onKeyDown }
                placeholder = { this.props.placeHolder }
                type = { this.props.type }
                value = { this.state.value } />
        );
    }

    _onBlur: () => void;

    /**
     * Callback for the onBlur event of the field.
     *
     * @returns {void}
     */
    _onBlur() {
        this.setState({
            focused: false
        });
    }

    _onChange: Object => void;

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    _onChange(evt) {
        const value = getFieldValue(evt);

        this.setState({
            value
        });

        const { onChange } = this.props;

        onChange && onChange(value);
    }

    _onFocus: () => void;

    /**
     * Callback for the onFocus event of the field.
     *
     * @returns {void}
     */
    _onFocus() {
        this.setState({
            focused: true
        });
    }

    _onKeyDown: Object => void;

    /**
     * Joins the conference on 'Enter'.
     *
     * @param {Event} event - Key down event object.
     * @returns {void}
     */
    _onKeyDown(event) {
        const { onSubmit } = this.props;

        onSubmit && event.key === 'Enter' && onSubmit();
    }
}
