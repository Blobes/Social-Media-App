"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    useGlobalContext, useCached, useAdaptiveTime,
    useSnackbar, useMisc, usePostLike as useGistLike
} from "@repo/shared-state";
import { GenericObject, UIMode, IGist, MediaProps } from "@repo/types";
import { mediaData } from "@repo/test-data";
import {
    Empty, PostObserver, PostHeader,
    PostCaption, Metrics, PostEngagement
} from "@repo/shared-ui";
import { GistService } from "./gistService";
import { GistMedia } from "./GistMedia";


interface GistProps {
    gist: IGist;
    style?: GenericObject<string>;
    mode?: UIMode;
}

export const GistCard = ({ gist, style = {}, mode = "ONLINE" }: GistProps) => {
    const theme = useTheme();
    const { setSBMessage } = useSnackbar();
    const { fetchGistLike, getPendingLike,
        setPendingLike, clearPendingLike } = GistService()
    const { authStatus, setModalContent } = useGlobalContext();
    const { isOffline, isUnstableNetwork } = useMisc();

    const { postData: gistData, isLiking, handleLike } = useGistLike(
        gist, fetchGistLike,
        {
            getPendingLike, setPendingLike, clearPendingLike,
            authStatus, setModalContent, isOffline,
            isUnstableNetwork, setSBMessage, mode,
            LoginPrompt: <Typography>Login to engage</Typography>
        })

    const { likeCount, likedByMe, content, media, authorId, author, createdAt } = gistData;

    const gistMedia: MediaProps[] = (media && media.length > 0)
        ? (media as MediaProps[]) : mediaData;

    // Gist Author logic
    const { cachedAuthor } = useCached(authorId);
    const gistAuthor = mode === "ONLINE" || !cachedAuthor ? author : cachedAuthor;

    if (gistData.status === "DELETED") return <Empty tagline="Deleted by author." />;

    // Prepare Metrics Data
    const postMetrics = [
        { label: "Like", count: likeCount, plural: "Likes" },
        { label: "Reply", count: 1500, plural: "Replies" },
        { label: "View", count: 20000, plural: "Views" }
    ];

    return (
        <PostObserver post={gistData} type="GIST">
            <Stack
                sx={{
                    gap: 0,
                    flexGrow: "0",
                    flexShrink: "0",
                    borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                    ...style,
                }} >
                {/* 1. Header Molecule */}
                <PostHeader
                    authorProps={{
                        author: gistAuthor,
                        avatarSize: "36px"
                    }}
                    actionProps={{
                        createdAt,
                        useActions: { useAdaptiveTime: () => useAdaptiveTime },
                        onMore: () => console.log("Open Menu"),
                        onFollow: () => console.log("Follow User")
                    }} />

                {/* 2. Caption/Content Molecule */}
                <PostCaption
                    caption={content}
                    limit={200}
                    sx={{
                        padding: theme.boxSpacing(4, 0),
                        [theme.breakpoints.down("md")]: {
                            padding: theme.boxSpacing(4, 6),
                        }
                    }} />

                {/* 3. Media Molecule */}
                <GistMedia
                    gist={gistData}
                    mediaList={gistMedia}
                    isLiking={isLiking}
                    mode={mode}
                    handleLike={handleLike} />

                {/* 4. Metrics Molecule (replaces the raw Strip) */}
                <Metrics
                    metrics={postMetrics}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                    }} />

                {/* 5. Engagement Molecule */}
                <PostEngagement
                    like={{ likedByMe, isLiking, handleLike, mode }}
                    reply={{ onClick: () => console.log("Reply clicked") }}
                    share={{ onClick: () => console.log("Share clicked") }}
                    bookmark={{
                        bookmarked: false,
                        onClick: () => console.log("Bookmark toggled")
                    }} />
            </Stack>
        </PostObserver>
    );
};