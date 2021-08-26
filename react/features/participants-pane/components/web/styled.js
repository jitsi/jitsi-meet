import React from 'react';
import styled from 'styled-components';

import { Icon, IconHorizontalPoints } from '../../../base/icons';
import { ACTION_TRIGGER } from '../../constants';

export const ignoredChildClassName = 'ignore-child';

export const AntiCollapse = styled.br`
  font-size: 0;
`;

export const Button = styled.button`
  align-items: center;
  background-color: ${
    // eslint-disable-next-line no-confusing-arrow
    props => props.primary ? '#0056E0' : '#3D3D3D'
};
  border: 0;
  border-radius: 6px;
  display: flex;
  font-weight: unset;
  justify-content: center;
  min-height: 32px;

  &:hover {
    background-color: ${
    // eslint-disable-next-line no-confusing-arrow
    props => props.primary ? '#246FE5' : '#525252'
};
  }
`;

export const QuickActionButton = styled(Button)`
  padding: 0 12px;
`;

export const Container = styled.div`
  box-sizing: border-box;
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: 0 ${props => props.theme.panePadding}px;

  & > * + *:not(.${ignoredChildClassName}) {
    margin-top: 16px;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const ContextMenu = styled.div.attrs(props => {
    return {
        className: props.className
    };
})`
  background-color: #292929;
  border-radius: 3px;
  box-shadow: 0px 3px 16px rgba(0, 0, 0, 0.6), 0px 0px 4px 1px rgba(0, 0, 0, 0.25);
  color: white;
  font-size: ${props => props.theme.contextFontSize}px;
  font-weight: ${props => props.theme.contextFontWeight};
  margin-top: ${props => {
        const {
            participantActionButtonHeight,
            participantItemHeight
        } = props.theme;

        return ((3 * participantItemHeight) + participantActionButtonHeight) / 4;
    }}px;
  position: absolute;
  right: ${props => props.theme.panePadding}px;
  top: 0;
  z-index: 2;

  & > li {
    list-style: none;
  }

  ${props => props.isHidden && `
    pointer-events: none;
    visibility: hidden;
  `}
`;

export const ContextMenuIcon = styled(Icon).attrs({
    size: 20
})`
  & > svg {
    fill: #a4b8d1;
  }
`;

export const ContextMenuItem = styled.div`
  align-items: center;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  min-height: 40px;
  padding: 10px 16px;

  & > *:not(:last-child) {
    margin-right: 16px;
  }

  &:hover {
    background-color: #525252;
  }
`;

export const ContextMenuItemGroup = styled.div`
  &:not(:empty) {
    padding: 8px 0;
  }

  & + &:not(:empty) {
    border-top: 1px solid #4C4D50;
  }
`;

export const Close = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 20px;
  justify-content: center;
  width: 20px;

  &:before, &:after {
    content: '';
    background-color: #a4b8d1;
    border-radius: 2px;
    height: 2px;
    position: absolute;
    transform-origin: center center;
    width: 21px;
  }

  &:before {
    transform: rotate(45deg);
  }

  &:after {
    transform: rotate(-45deg);
  }
`;

export const Footer = styled.div`
  background-color: #141414;
  display: flex;
  justify-content: flex-end;
  padding: 24px ${props => props.theme.panePadding}px;

  & > *:not(:last-child) {
    margin-right: 16px;
  }
`;

export const FooterButton = styled(Button)`
  height: 40px;
  font-size: 15px;
  padding: 0 16px;
`;

export const FooterEllipsisButton = styled(FooterButton).attrs({
    children: <Icon src = { IconHorizontalPoints } />
})`
  padding: 8px;
`;

export const FooterEllipsisContainer = styled.div`
  position: relative;
`;

export const Header = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  height: ${props => props.theme.headerSize}px;
  padding: 0 20px;
`;

export const Heading = styled.div`
  color: #d1dbe8;
  font-style: normal;
  font-size: 15px;
  line-height: 24px;
  margin: 8px 0 ${props => props.theme.panePadding}px;
`;

export const ParticipantActionButton = styled(Button)`
  height: ${props => props.theme.participantActionButtonHeight}px;
  padding: 6px 10px;
`;

export const ParticipantActionEllipsis = styled(ParticipantActionButton).attrs({
    children: <Icon src = { IconHorizontalPoints } />,
    primary: true
})`
  padding: 6px;
`;

export const ParticipantActions = styled.div`
  align-items: center;
  z-index: 1;

  & > *:not(:last-child) {
    margin-right: 8px;
  }
`;

export const ParticipantActionsHover = styled(ParticipantActions)`
  background-color: #292929;
  bottom: 1px;
  display: none;
  position: absolute;
  right: ${props => props.theme.panePadding};
  top: 0;

  &:after {
    content: '';
    background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #292929 100%);
    bottom: 0;
    display: block;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    transform: translateX(-100%);
  }
`;

export const ParticipantActionsPermanent = styled(ParticipantActions)`
  display: flex;
`;

export const ParticipantContent = styled.div`
  align-items: center;
  box-shadow: inset 0px -1px 0px rgba(255, 255, 255, 0.15);
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
  padding-right: ${props => props.theme.panePadding}px;
`;

export const ParticipantStates = styled.div`
  display: flex;
  justify-content: flex-end;

  & > * {
    align-items: center;
    display: flex;
    justify-content: center;
  }

  & > *:not(:last-child) {
    margin-right: 8px;
  }

  .jitsi-icon {
    padding: 3px;
  }
`;

export const ParticipantContainer = styled.div`
  align-items: center;
  color: white;
  display: flex;
  font-size: 13px;
  height: ${props => props.theme.participantItemHeight}px;
  margin: 0 -${props => props.theme.panePadding}px;
  padding-left: ${props => props.theme.panePadding}px;
  position: relative;

  &:hover {
    ${ParticipantStates} {
      ${props => !props.local && 'display: none'};
    }
  }

  ${props => !props.isHighlighted && '&:hover {'}
    background-color: #292929;

    & ${ParticipantActions} {
      ${props => props.trigger === ACTION_TRIGGER.HOVER && `
        display: flex;
      `}
    }

    & ${ParticipantContent} {
      box-shadow: none;
    }
  ${props => !props.isHighlighted && '}'}
`;

export const ParticipantInviteButton = styled(Button).attrs({
    primary: true
})`
  font-size: 15px;
  height: 40px;
  width: 100%;

  & > *:not(:last-child) {
    margin-right: 8px;
  }
`;

export const ParticipantName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ParticipantNameContainer = styled.div`
  display: flex;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
`;

export const RaisedHandIndicatorBackground = styled.div`
  background-color: #ed9e1b;
  border-radius: 3px;
  height: 24px;
  width: 24px;
`;

export const VolumeInput = styled.input.attrs({
    type: 'range'
})`
  width: 100%;
`;

export const VolumeInputContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const VolumeOverlay = styled.div`
  background-color: #0376da;
  border-radius: 1px 0 0 1px;
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
`;
