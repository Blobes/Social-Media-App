"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext, usePost } from "@repo/shared-state";
import { GenericObject, UIMode, IGist } from "@repo/types";
import { useGistService } from "../app/service";
import { getCachedAuthor, summarizeNum } from "@repo/helpers";
import { Empty, MediaProps, PostObserver, Strip } from "@repo/shared-ui";
import { useSnackbar, useMisc } from "@repo/shared-state";
import { mediaData } from "@repo/test-data";
import { GistMedia } from "../app/components/GistMedia";
import { useGistLike } from "../app/hooks/useGistLike";
import { GistHeader } from "../app/components/GistHeader";
import { GistEngagement } from "../app/components/GistEngagement";

interface GistProps {
    gist: IGist;
    style?: GenericObject<string>;
    mode?: UIMode
}

export const GistCard = ({ gist, style = {}, mode = "ONLINE" }: GistProps) => {
    const theme = useTheme();
    const gistService = useGistService()
    const globalContext = useGlobalContext();
    const controller = useMisc();
    const { setSBMessage } = useSnackbar();

    // Like hooks & properties
    const { gistData, isLiking, handleLike } = useGistLike(gist, {
        ...gistService, ...globalContext, ...controller, setSBMessage,
        mode, LoginPrompt: <Typography>Login to engage</Typography>
    });
    const { likeCount, likedByMe, content, media, authorId, author } = gistData;
    const gistMedia: MediaProps[] = (media && media.length > 0)
        ? (media as MediaProps[]) : mediaData;

    // Gist Author
    const { cachedAuthor } = usePost(authorId);
    const gistAuthor = mode === "ONLINE" || !cachedAuthor ? author : cachedAuthor

    if (gistData.status === "DELETED") return <Empty tagline="Deleted by author." />;

    return (
        <PostObserver post={gistData} type="GIST">
            <Stack
                sx={{
                    gap: theme.gap(0),
                    flexGrow: "0",
                    flexShrink: "0",
                    borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                    ...style,
                }}>
                <GistHeader author={gistAuthor} createdAt={gistData.createdAt} />

                {/* Gist content */}
                <Typography variant="body2" sx={{
                    padding: theme.boxSpacing(6, 0),
                    [theme.breakpoints.down("md")]: {
                        padding: theme.boxSpacing(6),
                    }
                }}>{content}</Typography>

                {/* Gist media */}
                <GistMedia mediaList={gistMedia} likedByMe={likedByMe}
                    handleLike={handleLike} />

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
        </PostObserver>
    );
};