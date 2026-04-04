"use client"

import { Stack, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { CircleCheckBig } from "lucide-react"

export const StatusSwitcher = () => {
    const theme = useTheme();

    return (
        <Stack direction="row" gap={theme.gap(10)} alignItems="center">
            <CircleCheckBig style={{ width: "18px", height: "18px" }} />
            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                Active now
            </Typography>
        </Stack>
    )
}