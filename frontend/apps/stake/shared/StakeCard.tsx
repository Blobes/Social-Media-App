"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericObject, IStake } from "@repo/types";


interface StakeProps {
    stake: IStake;
    style?: GenericObject<string>;
}

export const StakeCard = ({ stake, style = {} }: StakeProps) => {
    const theme = useTheme();

    const { content, media, } = stake

    return (
        <Stack
            sx={{
                gap: theme.gap(0),
                flexGrow: "0",
                flexShrink: "0",
                minHeight: "200px",
                background: `center / cover no-repeat url(${media}),
                ${theme.palette.gray.trans.overlay()}`,
                borderRadius: theme.radius[3],
                ...style,
            }}>
            {/* Post content */}
            <Typography variant="body2" sx={{
                padding: theme.boxSpacing(6, 0),
                textAlign: "center",
                [theme.breakpoints.down("md")]: {
                    padding: theme.boxSpacing(6),
                }
            }}>{content} </Typography>
        </Stack>
    );
};