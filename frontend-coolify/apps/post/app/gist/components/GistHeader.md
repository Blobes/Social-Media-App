import { Stack, Typography, IconButton } from "@mui/material";
import { UserAvatar, SmartDate } from "@repo/shared-ui";
import { UserPlus, EllipsisVertical } from "lucide-react";
import { IAuthor } from "@repo/core";
import { useTheme } from "@mui/material/styles";
import { useAdaptiveTime } from "@repo/shared-state";

interface HeaderProps {
author: IAuthor;
createdAt: string | number;
}

export const GistHeader = ({ author, createdAt }: HeaderProps) => {
const theme = useTheme();
// const authorFullName = `${author.firstName} ${author.lastName}`;

    return (
        <Stack direction="row"
            sx={{
                alignItems: "flex-start",
                gap: theme.gap(1),
                [theme.breakpoints.down("md")]: {
                    padding: theme.boxSpacing(0, 4),
                }
            }}>
            {/* Post Header */}
            <UserAvatar
                userInfo={{
                    firstName: author.firstName,
                    lastName: author.lastName,
                    profileImage: author.profileImage,
                }}
                style={{ width: "32px", height: "32px", fontSize: "16px" }}
                aria-label={author.fullName}
            />
            <Stack sx={{ width: "100%", gap: theme.gap(0), minWidth: "40px" }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: "bold" }}>
                    {author.fullName}
                </Typography>
                <Typography variant="body3" noWrap sx={{ color: theme.palette.gray[200], lineHeight: "1.1em" }}>
                    @{author.username}
                </Typography>
            </Stack>

            {/* Right side */}
            <Stack direction="row"
                sx={{
                    marginRight: theme.boxSpacing(-4),
                    alignItems: "center", gap: 0,
                    [theme.breakpoints.down("md")]: {
                        gap: theme.gap(4), margin: 0
                    }
                }}>

                {/* Date & time */}
                <SmartDate variant="body2"
                    timestamp={createdAt}
                    adaptiveTime={useAdaptiveTime}
                    sx={{
                        width: "fit-content",
                        color: theme.palette.gray[200],
                        padding: theme.boxSpacing(0, 4),
                        fontWeight: "600",
                        flex: "none",
                        [theme.breakpoints.down("md")]: {
                            padding: theme.boxSpacing(0, 2),
                        }
                    }} />

                {/* Follow user icon */}
                <IconButton sx={{
                    padding: theme.boxSpacing(2.5),
                    borderRadius: theme.radius.full,
                    [theme.breakpoints.down("md")]: {
                        padding: theme.boxSpacing(0)
                    }
                }}>
                    <UserPlus style={{ stroke: theme.palette.gray[200] }} size={20} />
                </IconButton>

                {/* More action icon */}
                <IconButton sx={{
                    padding: theme.boxSpacing(2.5),
                    borderRadius: theme.radius.full,
                    [theme.breakpoints.down("md")]: {
                        padding: theme.boxSpacing(0)
                    }
                }}>
                    <EllipsisVertical style={{ stroke: theme.palette.gray[200] }} size={20} />
                </IconButton>
            </Stack>
        </Stack>
    );

};
