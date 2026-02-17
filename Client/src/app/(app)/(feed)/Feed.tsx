"use client";

import { Stack, Typography } from "@mui/material";
import { GistCard } from "../(features)/gist/card/GistCard";
import { CreatePost } from "../(features)/gist/CreateGist";
import { ProgressIcon } from "@/components/LoadingUIs";
import { Empty } from "@/components/Empty";
import { Milestone } from "lucide-react";
import { useFeed } from "./useFeed";
import { useMemo } from "react";
import { useStyles } from "@/hooks/style";
import { useTheme } from "@mui/material/styles";
import { StakeCard } from "../(features)/stake/StakeCard";


export const Feed = () => {
    const theme = useTheme();
    const { feed, message, isLoading, handleRefresh, mode } = useFeed();
    const { autoScroll } = useStyles();

    const containerStyle = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            minWidth: "400px",
            gap: theme.gap(8),
            padding: theme.boxSpacing(8, 24),
            ...(feed.length > 1 && autoScroll().base),
            [theme.breakpoints.down("md")]: {
                maxWidth: "unset",
                minWidth: "unset",
                padding: theme.boxSpacing(0),
                ...(!isLoading && autoScroll().mobile),
            },
        }),
        [theme, feed.length, isLoading, autoScroll],
    );

    return (
        <Stack sx={containerStyle}>
            <CreatePost />

            {isLoading ? (
                <Stack sx={{
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <ProgressIcon otherProps={{ size: 24 }} />
                </Stack>
            ) : (feed.length < 1 ? (
                <Empty
                    tagline={message || "Something went wrong, check your network"}
                    icon={<Milestone />}
                    primaryCta={{
                        type: "BUTTON",
                        variant: "outlined",
                        label: "Refresh",
                        action: handleRefresh,
                    }}
                    style={{
                        container: {
                            height: "100%",
                            backgroundColor: "none",
                            gap: theme.gap(6)
                        },
                        tagline: { fontSize: "16px" },
                        icon: {
                            width: "50px", height: "50px",
                            [theme.breakpoints.down("md")]: {
                                width: "40px", height: "40px"
                            },
                            svg: {
                                fill: "none",
                                stroke: theme.palette.gray[200],
                                strokeWidth: "1.5px"
                            },
                        },
                    }} />
            ) : (feed.map((post) => {
                switch (post.type) {
                    case "gist":
                        return <GistCard key={post._id} gist={post} mode={mode} />

                    case "stake":
                        return <StakeCard key={post._id} stake={post} />

                    default: <Typography>Post type not found</Typography>
                }
            }))
            )}
        </Stack>
    );
};