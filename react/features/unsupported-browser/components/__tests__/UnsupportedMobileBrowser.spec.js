/* @flow */

import React from 'react';
import { shallow } from 'enzyme';

import HideNotificationBarStyle from '../HideNotificationBarStyle';
import { UnsupportedMobileBrowser } from '../UnsupportedMobileBrowser';

const oldLocation = window.location;

declare var afterAll: Function;
declare var beforeAll: Function;
declare var describe: Function;
declare var expect: Function;
declare var it: Function;

/**
 * Renders UnsupportedMobileBrowser with corresponding props.
 *
 * @param {string} room - Room name proprety.
 * @returns {ShallowWrapper}
 * @private
 */
function _prepareComponent(room) {
    const props = {
        _room: room,
        t: key => key
    };

    return shallow(<UnsupportedMobileBrowser { ...props } />);
}

/**
 * Test suite related to UnsupportedMobileBrowser component.
 */
describe('UnsupportedMobileBrowser component', () => {

    /**
     * Since tests are being run in Node environment we should set some browser
     * specific data like location etc before running the tests.
     */
    beforeAll(() => {
        window.location = window.location || {
            href: 'https://test'
        };
    });

    /**
     * Set previous value of location after running of all the tests.
     */
    afterAll(() => {
        window.location = oldLocation;
    });

    /**
     * Checks whether HideNotificationBarStyle is being rendered.
     */
    it('should render HideNotificationBarStyle', () => {
        const wrapper = _prepareComponent();

        expect(wrapper.find(HideNotificationBarStyle)).toHaveLength(1);
    });

    /**
     * UnsupportedMobileBrowser component should render app specific link in
     * order to have possibility to open/start the conference in mobile app.
     */
    it('should set app specific link to the state', () => {
        const wrapper = _prepareComponent();

        expect(wrapper.state('joinURL')).toBe('org.jitsi.meet:https://test');
    });

    /**
     * If room is defined UnsupportedMobileBrowser component should show the
     * text informing the user that she can join the conference.
     */
    it('should set joinConference translation key if room is defined', () => {
        const wrapper = _prepareComponent('test');

        expect(wrapper.state('joinText')).toBe('joinConversation');
    });

    /**
     * If room is not defined UnsupportedMobileBrowser component should show
     * the text informing the user that she can start a new conference.
     */
    it('should set startConference translation if room is not defined', () => {
        const wrapper = _prepareComponent();

        expect(wrapper.state('joinText')).toBe('startConference');
    });
});
