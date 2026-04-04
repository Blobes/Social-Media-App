"use client"

import { styled } from '@mui/material/styles';
import { Box, } from '@mui/material';

export const AnimatedWrapper = styled(Box)(({ theme }) => ({
    display: 'inline-flex', // Fits the size of the child
    alignItems: 'center',
    justifyContent: 'center',
    overflow: "hidden"
}));