"use client"

import { Stack, IconButton, SxProps, Theme } from "@mui/material";
import { SmartDate } from "../../SmartDate";
import { UserPlus, EllipsisVertical } from "lucide-react";
import { useTheme } from "@mui/material/styles";

interface UseActions {
    useAdaptiveTime: () => any;
}

export interface ActionsProps {
    createdAt: string | number;
    onFollow?: () => void;
    onMore?: () => void;
    showFollow?: boolean;
    sx?: SxProps<Theme>;
    useActions: UseActions
}

export const HeaderActions = ({ createdAt, onFollow, onMore,
    showFollow = true, useActions, sx }: ActionsProps) => {
    const theme = useTheme();
    const { useAdaptiveTime } = useActions

    const iconButtonSx: SxProps<Theme> = {
        padding: theme.boxSpacing(2.5),
        borderRadius: theme.radius.full,
        [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(0)
        }
    };

    return (
        <Stack direction="row"
            sx={{
                marginRight: theme.boxSpacing(-4),
                alignItems: "center",
                gap: 0,
                [theme.breakpoints.down("md")]: {
                    gap: theme.gap(4),
                    margin: 0
                },
                ...sx
            }}>
            <SmartDate
                variant="body2"
                timestamp={createdAt}
                adaptiveTime={useAdaptiveTime}
                sx={{
                    color: theme.palette.gray[200],
                    padding: theme.boxSpacing(0, 4),
                    fontWeight: "600",
                    width: "fit-content",
                    flex: "none",
                    [theme.breakpoints.down("md")]: {
                        padding: theme.boxSpacing(0, 2),
                    }
                }}

            />

            {showFollow && (
                <IconButton sx={iconButtonSx} onClick={onFollow}>
                    <UserPlus style={{ stroke: theme.palette.gray[200] }} size={20} />
                </IconButton>
            )}

            <IconButton sx={iconButtonSx} onClick={onMore}>
                <EllipsisVertical style={{ stroke: theme.palette.gray[200] }} size={20} />
            </IconButton>
        </Stack>
    );
};