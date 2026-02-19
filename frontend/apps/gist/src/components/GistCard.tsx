"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { sharedRegistry, useGlobalContext } from "@funstakes/shared-state";
import { GenericObject, UIMode, IGist } from "@funstakes/types";
import { useGistService } from "../service";
import { summarizeNum } from "@funstakes/helpers";
import { Empty, Strip } from "@funstakes/shared-ui";
import { useSnackbar, useMisc } from "@funstakes/hooks";
import { mediaData } from "libs/test-data/postData";
import { GistMedia } from "./GistMedia";
import { useGistAuthor } from "../hooks/useGistAuthor";
import { useGistLike } from "../hooks/useGistLike";
import { GistHeader } from "./GistHeader";
import { GistEngagement } from "./GistEngagement";

interface GistProps {
    gist: IGist;
    style?: GenericObject<string>;
    mode?: UIMode
}

export const GistCard = ({ gist, style = {}, mode = "online" }: GistProps) => {
    const theme = useTheme();
    const postService = useGistService();
    const globalContext = useGlobalContext();
    const controller = useMisc();
    const { setSBMessage } = useSnackbar();

    const Login = sharedRegistry.components["Login"]

    // Author hooks & properties
    const { author, error } = useGistAuthor(gist.authorId, postService.fetchAuthor, mode);

    // Like hooks & properties
    const { gistData, isLiking, handleLike } = useGistLike(gist, {
        ...postService, ...globalContext, ...controller, setSBMessage,
        mode, LoginPrompt: <Login />
    });
    const { likeCount, likedByMe, content } = gistData;
    const postMedia = mediaData

    if (!author) return <Empty tagline={error || "Loading author..."} />;
    if (gistData.status === "DELETED") return <Empty tagline="Deleted by author." />;

    return (
        <Stack
            sx={{
                gap: theme.gap(0),
                flexGrow: "0",
                flexShrink: "0",
                borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                ...style,
            }}>
            <GistHeader author={author} createdAt={gistData.createdAt} />

            {/* Gist content */}
            <Typography variant="body2" sx={{
                padding: theme.boxSpacing(6, 0),
                [theme.breakpoints.down("md")]: {
                    padding: theme.boxSpacing(6),
                }
            }}>{content}</Typography>

            {/* Gist media */}
            {postMedia && <GistMedia mediaList={postMedia}
                likedByMe={likedByMe} handleLike={handleLike} />}

            {/* Gist info strip */}
            <Strip
                items={[
                    {
                        text: likeCount > 1 ? "Likes" : "Like",
                        element: (
                            <strong style={{ color: theme.palette.gray[300] as string }}>
                                {summarizeNum(likeCount)}
                            </strong>
                        ),
                    },
                    {
                        text: 1500 > 1 ? "Replies" : "Reply",
                        element: (
                            <strong style={{ color: theme.palette.gray[300] as string }}>
                                {summarizeNum(1500)}
                            </strong>
                        ),
                    },
                    {
                        text: 20000 > 1 ? " Views" : " View",
                        element: (
                            <strong style={{ color: theme.palette.gray[300] as string }}>
                                {summarizeNum(20000)}
                            </strong>
                        ),
                    },
                ]}
                style={{
                    padding: theme.boxSpacing(4, 0),
                    [theme.breakpoints.down("md")]: {
                        padding: theme.boxSpacing(4, 6),
                    },
                    borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                    fontSize: "14px"
                }}
            />

            {/* Gist engagement  */}
            <GistEngagement
                likedByMe={likedByMe}
                isLiking={isLiking}
                handleLike={handleLike}
                mode={mode}
            />
        </Stack>
    );
};