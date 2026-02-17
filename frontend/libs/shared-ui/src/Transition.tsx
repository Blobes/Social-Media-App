"use client";

import {
  Fade,
  Grow,
  Slide,
  Zoom,
  Collapse,
  SlideProps,
  FadeProps,
  GrowProps,
  ZoomProps,
  CollapseProps
} from '@mui/material';
import { TransitionGroup } from 'react-transition-group';

// Define the available MUI transition types
export type TransitionType = 'fade' | 'grow' | 'slide' | 'zoom' | 'collapse';

// Combine all possible props from MUI transition components
type MuiTransitionProps = SlideProps & FadeProps & GrowProps & ZoomProps & CollapseProps;

interface TransitionProps extends Partial<MuiTransitionProps> {
  type: TransitionType;
  show?: boolean;
  children: React.ReactElement<any, any>;
}

export const Transition = ({ type, show, children, ...props }: TransitionProps) => {
  // Map strings to actual MUI components
  const components = {
    fade: Fade,
    grow: Grow,
    slide: Slide,
    zoom: Zoom,
    collapse: Collapse,
  };
  const Component = components[type];

  return (
    <Component in={show ?? props.in} mountOnEnter unmountOnExit {...props}>
      {children}
    </Component>
  );
};

interface GroupTransitionProps {
  children: React.ReactNode;
}
export const GroupTransition = ({ children }: GroupTransitionProps) => {
  return (
    <TransitionGroup component={null}>
      {children}
    </TransitionGroup>
  );
};