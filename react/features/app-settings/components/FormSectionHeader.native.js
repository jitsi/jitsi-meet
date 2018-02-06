// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getSafetyOffset } from '../../base/react';
import { ASPECT_RATIO_WIDE } from '../../base/responsive-ui';

import styles, { CONTAINER_PADDING } from './styles';

/**
 * The type of the React {@code Component} props of {@link FormSectionHeader}
 */
type Props = {

    /**
     * The current aspect ratio of the screen.
     */
    _aspectRatio: Symbol,

    /**
     * The i18n key of the text label of the section.
     */
    i18nLabel: string,

    /**
     * An external style object passed to the component.
     */
    style: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Implements a React {@code Component} which renders a section header on a
 * form. This calculates the available safe view as well.
 */
class FormSectionHeader extends Component<Props> {
    /**
     * Initializes a new {@code FormSectionHeader} instance.
     *
     * @param {Object} props - Component properties.
     */
    constructor(props) {
        super(props);

        this._getSafetyMargin = this._getSafetyMargin.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <View
                style = { [
                    styles.formSectionTitle,
                    this.props.style,
                    this._getSafetyMargin()
                ] } >
                <Text>
                    { t(this.props.i18nLabel) }
                </Text>
            </View>
        );
    }

    _getSafetyMargin: () => Object;

    /**
     * Calculates the safety margin for this header. See comment in
     * functions.js.
     *
     * @private
     * @returns {Object}
     */
    _getSafetyMargin() {
        if (this.props._aspectRatio === ASPECT_RATIO_WIDE) {
            const safeOffset
                = Math.max(getSafetyOffset() - CONTAINER_PADDING, 0);

            return {
                marginLeft: safeOffset,
                marginRight: safeOffset
            };
        }

        return undefined;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code FormSectionHeader}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Object}
 */
export function _mapStateToProps(state: Object) {
    return {
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio
    };
}

export default translate(connect(_mapStateToProps)(FormSectionHeader));
