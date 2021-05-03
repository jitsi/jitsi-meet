import React from 'react';
import styled from 'styled-components';

import { Icon, IconHorizontalPoints } from '../../base/icons';
import { ActionTrigger } from '../constants';

export const ignoredChildClassName = 'ignore-child';

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

  &:hover {
    background-color: ${
    // eslint-disable-next-line no-confusing-arrow
    props => props.primary ? '#246FE5' : '#525252'
};
  }
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
            roomActionButtonHeight,
            roomItemHeight
        } = props.theme;

        return ((3 * roomItemHeight) + roomActionButtonHeight) / 4;
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
  height: 40px;
  padding: 8px 16px;

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

export const Heading = styled.div`
  color: #d1dbe8;
  font-style: normal;
  font-size: 15px;
  line-height: 24px;
  margin: 8px 0 ${props => props.theme.panePadding}px;
`;

export const RoomActionButton = styled(Button)`
  height: ${props => props.theme.roomActionButtonHeight}px;
  padding: 6px 10px;
`;

export const RoomActionEllipsis = styled(RoomActionButton).attrs({
    children: <Icon src = { IconHorizontalPoints } />,
    primary: true
})`
  padding: 6px;
`;

export const RoomActions = styled.div`
  align-items: center;
  z-index: 1;

  & > *:not(:last-child) {
    margin-right: 8px;
  }
`;

export const RoomActionsHover = styled(RoomActions)`
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
    width: 40px;
  }
`;

export const RoomActionsPermanent = styled(RoomActions)`
  display: flex;
`;

export const RoomContent = styled.div`
  align-items: center;
  box-shadow: inset 0px -1px 0px rgba(255, 255, 255, 0.15);
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
  padding-right: ${props => props.theme.panePadding}px;
`;

export const RoomContainer = styled.div`
  align-items: center;
  color: white;
  display: flex;
  font-size: 13px;
  height: ${props => props.theme.roomItemHeight}px;
  margin: 0 -${props => props.theme.panePadding}px;
  padding-left: ${props => props.theme.panePadding}px;
  position: relative;

  ${props => !props.isHighlighted && '&:hover {'}
    background-color: #292929;

    & ${RoomActions} {
      ${props => props.trigger === ActionTrigger.Hover && `
        display: flex;
      `}
    }

    & ${RoomContent} {
      box-shadow: none;
    }
  ${props => !props.isHighlighted && '}'}
`;

export const RoomLeaveButton = styled(Button).attrs({
    primary: true
})`
  font-size: 15px;
  height: 40px;
  width: 100%;

  & > *:not(:last-child) {
    margin-right: 8px;
  }
`;

export const RoomName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RoomNameContainer = styled.div`
  display: flex;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
`;
