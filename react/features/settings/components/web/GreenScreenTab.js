// @flow

import { Checkbox } from '@atlaskit/checkbox';
import DropdownMenu, {
    DropdownItem,
    DropdownItemGroup
} from '@atlaskit/dropdown-menu';
import Range from '@atlaskit/range';
import React from 'react';
import { ChromePicker } from 'react-color';

import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link GreenScreenTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    enabled: boolean,

    image: Object,

    algorithmType: string,

    outputStride: number,

    multiplier: number,

    quantBytes: number,

    chromaKey: Object,

    chromaThreshold: number,

    fps: number,

    internalResolution: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function

}

/**
 * The type of the React {@code Component} state of {@link MoreTab}.
 */
type State = {

    isAlgorithmTypeOpen: boolean,
    isOutputStrideOpen: boolean,
    isMultiplierOpen: boolean,
    isQuantBytesOpen: boolean,
    isInternalResolutionOpen: boolean

};

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @extends Component
 */
class GreenScreenTab extends AbstractDialogTab<Props, State> {

    static defaultProps = {
        enabled: false,
        image: undefined,
        algorithmType: 'mobileNet',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
        chromaKey: {
            r: 0,
            g: 255,
            b: 0
        },
        chromaThreshold: 100,
        fps: 30,
        internalResolution: 'medium'
    };

    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            isAlgorithmTypeOpen: false,
            isOutputStrideOpen: false,
            isMultiplierOpen: false,
            isQuantBytesOpen: false,
            isInternalResolutionOpen: false
        };


        // Bind event handler so it is only bound once for every instance.
        this._onGreenScreenChange = this._onGreenScreenChange.bind(this);
    }

    _onGreenScreenChange: (Object) => void;

    /**
     * Handle when the user selects a new green screen image.
     *
     * @param {Object} event - Input type=file on change event object.
     * @returns {void}
     */
    _onGreenScreenChange(event) {
        if (!event.target || !event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            super._onChange({
                image: {
                    name: file.name,
                    data: reader.result
                }
            });
        });

        reader.readAsDataURL(file);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            enabled,
            image,
            algorithmType,
            outputStride,
            multiplier,
            quantBytes,
            chromaKey,
            chromaThreshold,
            fps,
            internalResolution,
            t
        } = this.props;

        return (
            <div className = 'green-screen-edit'>
                <div className = 'settings-pane'>
                    <div className = 'settings-sub-pane settings-column-margin-right'>
                        <Checkbox
                            className = 'settings-green-screen-enabled'
                            isChecked = { enabled }
                            label = { t('settings.greenScreen.enabled') }
                            name = 'green-screen-enabled'
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange = {
                                ({ target: { checked } }) =>
                                    super._onChange({ enabled: checked })
                            } />
                        <div className = 'mock-atlaskit-label'>{ t('settings.greenScreen.type') }</div>
                        <div>{ t('settings.greenScreen.typeRestart') }</div>
                        <DropdownMenu
                            isOpen = { this.state.isAlgorithmTypeOpen }
                            // eslint-disable-next-line react/jsx-no-bind
                            onOpenChange = { ({ isOpen }) => {
                                this.setState({ isAlgorithmTypeOpen: isOpen });
                            } }
                            shouldFitContainer = { true }
                            trigger = { algorithmType ? t(`settings.greenScreen.types.${algorithmType}.label`) : '' }
                            triggerButtonProps = {{
                                appearance: 'default',
                                shouldFitContainer: true
                            }}
                            triggerType = 'button'>
                            <DropdownItemGroup>
                                <DropdownItem
                                    key = { t('settings.greenScreen.types.chroma.label') }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick = { () => super._onChange({ algorithmType: 'chroma' }) }>
                                    { t('settings.greenScreen.types.chroma.label') }
                                </DropdownItem>
                                <DropdownItem
                                    key = { t('settings.greenScreen.types.mobileNet.label') }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick = { () => super._onChange({ algorithmType: 'mobileNet' }) }>
                                    { t('settings.greenScreen.types.mobileNet.label') }
                                </DropdownItem>
                                <DropdownItem
                                    key = { t('settings.greenScreen.types.resNet.label') }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick = { () => super._onChange({ algorithmType: 'resNet' }) }>
                                    { t('settings.greenScreen.types.resNet.label') }
                                </DropdownItem>
                            </DropdownItemGroup>
                        </DropdownMenu>
                        { algorithmType ? <div>{ t(`settings.greenScreen.types.${algorithmType}.help`) }</div> : null }
                        { algorithmType === 'chroma' ? (
                            <div>
                                <div className = 'mock-atlaskit-label'>{ t('settings.greenScreen.chroma.label') }</div>
                                <div className = 'settings-green-screen-chrome-picker-wrapper'>
                                    <ChromePicker
                                        color = { chromaKey }
                                        disableAlpha = { true }
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onChangeComplete = { value => {
                                            super._onChange({ chromaKey: value.rgb });
                                        } } />
                                </div>
                                <div className = 'mock-atlaskit-label'>
                                    { t('settings.greenScreen.threshold.label') }
                                </div>
                                <Range
                                    max = { 765 }
                                    min = { 0 }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onChange = { value => super._onChange({ chromaThreshold: value }) }
                                    step = { 1 }
                                    value = { chromaThreshold } />
                                <div>The current threshold is: {chromaThreshold}</div>
                                <div>{ t('settings.greenScreen.threshold.help') }</div>
                            </div>
                        ) : (
                            <div>
                                <div className = 'settings-green-screen-restart-message'>
                                    { t('settings.greenScreen.settingsRestart') }
                                </div>
                                <div className = 'mock-atlaskit-label'>
                                    { t('settings.greenScreen.outputStride.label') }
                                </div>
                                <DropdownMenu
                                    isOpen = { this.state.isOutputStrideOpen }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onOpenChange = { ({ isOpen }) => {
                                        this.setState({ isOutputStrideOpen: isOpen });
                                    } }
                                    shouldFitContainer = { true }
                                    trigger = { outputStride }
                                    triggerButtonProps = {{
                                        appearance: 'default',
                                        shouldFitContainer: false
                                    }}
                                    triggerType = 'button'>
                                    <DropdownItemGroup>
                                        { algorithmType === 'mobileNet' ? <DropdownItem
                                            key = '8'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ outputStride: 8 }) }>
                                            8
                                        </DropdownItem> : null }
                                        <DropdownItem
                                            key = '16'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ outputStride: 16 }) }>
                                            16
                                        </DropdownItem>
                                        { algorithmType === 'resNet' ? <DropdownItem
                                            key = '32'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ outputStride: 32 }) }>
                                            32
                                        </DropdownItem> : null }
                                    </DropdownItemGroup>
                                </DropdownMenu>
                                <div>{ t('settings.greenScreen.outputStride.help') }</div>
                                { algorithmType === 'mobileNet' ? (
                                    <div>
                                        <div className = 'mock-atlaskit-label'>
                                            { t('settings.greenScreen.multiplier.label') }
                                        </div>
                                        <DropdownMenu
                                            isOpen = { this.state.isMultiplierOpen }
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onOpenChange = { ({ isOpen }) => {
                                                this.setState({ isMultiplierOpen: isOpen });
                                            } }
                                            shouldFitContainer = { true }
                                            trigger = { multiplier }
                                            triggerButtonProps = {{
                                                appearance: 'default',
                                                shouldFitContainer: false
                                            }}
                                            triggerType = 'button'>
                                            <DropdownItemGroup>
                                                <DropdownItem
                                                    key = '1'
                                                    // eslint-disable-next-line react/jsx-no-bind
                                                    onClick = { () => super._onChange({ multiplier: 1 }) }>
                                                    1
                                                </DropdownItem>
                                                <DropdownItem
                                                    key = '.75'
                                                    // eslint-disable-next-line react/jsx-no-bind
                                                    onClick = { () => super._onChange({ multiplier: 0.75 }) }>
                                                    .75
                                                </DropdownItem>
                                                <DropdownItem
                                                    key = '.5'
                                                    // eslint-disable-next-line react/jsx-no-bind
                                                    onClick = { () => super._onChange({ multiplier: 0.5 }) }>
                                                    .5
                                                </DropdownItem>
                                            </DropdownItemGroup>
                                        </DropdownMenu>
                                        <div>{ t('settings.greenScreen.multiplier.help') }</div>
                                    </div>
                                ) : null }
                                <div className = 'mock-atlaskit-label'>
                                    { t('settings.greenScreen.quantBytes.label') }
                                </div>
                                <DropdownMenu
                                    isOpen = { this.state.isQuantBytesOpen }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onOpenChange = { ({ isOpen }) => {
                                        this.setState({ isQuantBytesOpen: isOpen });
                                    } }
                                    shouldFitContainer = { true }
                                    trigger = { quantBytes }
                                    triggerButtonProps = {{
                                        appearance: 'default',
                                        shouldFitContainer: false
                                    }}
                                    triggerType = 'button'>
                                    <DropdownItemGroup>
                                        <DropdownItem
                                            key = '4'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ quantBytes: 4 }) }>
                                            4
                                        </DropdownItem>
                                        <DropdownItem
                                            key = '2'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ quantBytes: 2 }) }>
                                            2
                                        </DropdownItem>
                                        <DropdownItem
                                            key = '1'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ quantBytes: 1 }) }>
                                            1
                                        </DropdownItem>
                                    </DropdownItemGroup>
                                </DropdownMenu>
                                <div>{ t('settings.greenScreen.quantBytes.help') }</div>
                                <div className = 'mock-atlaskit-label'>
                                    { t('settings.greenScreen.internalResolution.label') }
                                </div>
                                <DropdownMenu
                                    isOpen = { this.state.isInternalResolutionOpen }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onOpenChange = { ({ isOpen }) => {
                                        this.setState({ isInternalResolutionOpen: isOpen });
                                    } }
                                    shouldFitContainer = { true }
                                    trigger = { internalResolution }
                                    triggerButtonProps = {{
                                        appearance: 'default',
                                        shouldFitContainer: false
                                    }}
                                    triggerType = 'button'>
                                    <DropdownItemGroup>
                                        <DropdownItem
                                            key = 'low'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ internalResolution: 'low' }) }>
                                            low
                                        </DropdownItem>
                                        <DropdownItem
                                            key = 'medium'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ internalResolution: 'medium' }) }>
                                            medium
                                        </DropdownItem>
                                        <DropdownItem
                                            key = 'high'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ internalResolution: 'high' }) }>
                                            high
                                        </DropdownItem>
                                        <DropdownItem
                                            key = 'full'
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick = { () => super._onChange({ internalResolution: 'full' }) }>
                                            full
                                        </DropdownItem>
                                    </DropdownItemGroup>
                                </DropdownMenu>
                                <div>{ t('settings.greenScreen.internalResolution.help') }</div>
                            </div>
                        ) }
                    </div>
                    <div className = 'settings-sub-pane'>
                        <div className = 'mock-atlaskit-label'>{ t('settings.greenScreen.input') }</div>
                        <input
                            accept = 'image/*'
                            onChange = { this._onGreenScreenChange }
                            type = 'file' />
                        { image && image.name ? (
                            <div>
                                <div>{t('settings.greenScreen.selected')}: {image.name}</div>
                                <img
                                    className = 'settings-green-screen-image-preview'
                                    src = { image.data } />
                            </div>
                        ) : null }
                        <div className = 'mock-atlaskit-label'>{ t('settings.greenScreen.fps.label') }</div>
                        <div>{ t('settings.greenScreen.fpsRestart') }</div>
                        <Range
                            max = { 60 }
                            min = { 1 }
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange = { value => super._onChange({ fps: value }) }
                            step = { 1 }
                            value = { fps } />
                        <div>The current FPS is: {fps}</div>
                        <div>{ t('settings.greenScreen.fps.help') }</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default translate(GreenScreenTab);
