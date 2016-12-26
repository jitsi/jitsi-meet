import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { landingIsShown } from '../actions';

const links = {
    'android': 'https://play.google.com/store/apps/details?id=org.jitsi.meet',
    'ios': ''
};

/**
 * React component representing mobile landing page.
 *
 * @class Landing
 */
class Landing extends Component {
    /**
     * React lifecycle method triggered after
     * component is mount.
     *
     * @returns {void}
     */
    componentDidMount() {
        this.props.dispatch(landingIsShown());
    }

    static propTypes = {
        dispatch: React.PropTypes.func,
        location: React.PropTypes.object
    };

    /**
     * React lifecycle method triggered before
     * component will mount.
     *
     * @returns {void}
     */
    componentWillMount() {
        const { query } = this.props.location;
        const { conferenceName, platform } = query;
        let btnText;
        let link = '/';

        if (conferenceName) {
            btnText = 'Join the conversation';
            link += conferenceName;
        } else {
            btnText = 'Start a conference';
        }

        this.setState({
            btnText,
            link,
            platform
        });
    }

    /**
     * Renders landing component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { btnText, link, platform } = this.state;
        const primaryButtonClasses = 'landing__button landing__button_primary';

        return (
            <div className = 'landing'>
                <div className = 'landing__body'>
                    <img
                        className = 'landing__logo'
                        src = '/images/logo-blue.svg' />
                    <p className = 'landing__text'>
                       You need <strong>Meet Jitsi</strong> to
                       join a conversation on your mobile
                    </p>
                    <a href = { links[platform] }>
                        <button
                            className = { primaryButtonClasses }>
                            Download the App
                        </button>
                    </a>
                    <p className = 'landing__text landing__text_small'>
                       or if you already have it
                       <br /><strong>then</strong>
                    </p>
                    <Link to = { link }>
                        <button
                            className = 'landing__button'>{ btnText }</button>
                    </Link>
                </div>
            </div>
        );
    }
}

export default connect()(Landing);
