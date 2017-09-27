import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * The React {@link Component} which is similar to Web's
 * {@code HTMLAudioElement}.
 */
export default class AbstractAudio extends Component {
    /**
     * The (reference to the) {@link ReactElement} which actually implements
     * this {@code AbstractAudio}.
     */
    _ref: ?Object

    /**
     * {@code AbstractAudio} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The URL of a media resource to use in the element.
         *
         * @type {string}
         */
        src: PropTypes.string,
        stream: PropTypes.object
    };

    /**
     * Initializes a new {@code AbstractAudio} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._setRef = this._setRef.bind(this);
    }

    /**
     * Attempts to pause the playback of the media.
     *
     * @public
     * @returns {void}
     */
    pause() {
        this._ref && typeof this._ref.pause === 'function' && this._ref.pause();
    }

    /**
     * Attempts to being the playback of the media.
     *
     * @public
     * @returns {void}
     */
    play() {
        this._ref && typeof this._ref.play === 'function' && this._ref.play();
    }

    /**
     * Renders this {@code AbstractAudio} as a React {@link Component} of a
     * specific type.
     *
     * @param {string|ReactClass} type - The type of the React {@code Component}
     * which is to be rendered.
     * @param {Object|undefined} props - The read-only React {@code Component}
     * properties, if any, to render. If {@code undefined}, the props of this
     * instance will be rendered.
     * @protected
     * @returns {ReactElement}
     */
    _render(type, props) {
        const {
            children,

            /* eslint-disable no-unused-vars */

            // The following properties are consumed by React itself so they are
            // to not be propagated.
            ref,

            /* eslint-enable no-unused-vars */

            ...filteredProps
        } = props || this.props;

        return (
            React.createElement(
                type,
                {
                    ...filteredProps,
                    ref: this._setRef
                },
                children));
    }

    /**
     * Set the (reference to the) {@link ReactElement} which actually implements
     * this {@code AbstractAudio}.
     *
     * @param {Object} ref - The (reference to the) {@code ReactElement} which
     * actually implements this {@code AbstractAudio}.
     * @private
     * @returns {void}
     */
    _setRef(ref) {
        this._ref = ref;
    }
}
