"use client"

import { Box, Stack, Typography, Fade } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IMedia, IPostType } from "@repo/types";
import { MediaRenderer } from "../MediaRenderer";
import { DoubleTap } from "../../DoubleTap";
import { Carousel } from "../../carousel/Carousel";
import { IsolatedHeader } from "./Header";
import { IsolatedFooter } from "./Footer";
import { useIsolatedMedia } from "./useIsolated";

export interface IsolatedProps {
    mediaList?: IMedia[];
    postEngagment?: React.ReactNode;
    postHeader?: React.ReactNode;
    postCaption?: React.ReactNode;
    postType?: IPostType;
    isDesktop?: boolean;
    onDoubleTap?: () => void;
    style?: any;
    hideInfo?: boolean;
    initialIndex?: number;
}

export const IsolatedMedia = ({
    mediaList = [], postEngagment, postHeader, postCaption, postType = "GIST",
    isDesktop, onDoubleTap, style, initialIndex
}: IsolatedProps) => {

    const theme = useTheme();

    const { activeIndex, hideInfo, handleSingleTap, handleDoubleTap, handleSetCurrentIndex,
        handleBackClick, handleMoreClick, } = useIsolatedMedia({ mediaList, onDoubleTap, initialIndex });

    const carouselItems = mediaList.map((media) => (
        <MediaRenderer
            key={media._id}
            media={media}
            style={{ content: { maxHeight: isDesktop ? "80svh" : "60svh" } }}
        />
    ));

    const MediaContent = () => {
        if (!mediaList || mediaList.length === 0) return null;
        if (mediaList.length === 1) return <MediaRenderer media={mediaList[0]} />;
        return (
            <Carousel items={carouselItems} setCurrentIndex={handleSetCurrentIndex} />
        );
    };

    return (
        <DoubleTap onSingleTap={handleSingleTap} onDoubleTap={handleDoubleTap}>
            <Stack
                direction={isDesktop ? "row" : "column"}
                sx={{
                    width: isDesktop ? '60%' : '100%',
                    height: 'auto',
                    mx: 'auto',
                    position: 'relative',
                    ...style
                }}>

                <Stack sx={{ flex: 1, width: '100%', position: 'relative' }}>

                    {/* Immersive Counter Overlay */}
                    {mediaList.length > 1 && !hideInfo && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: isDesktop ? 80 : 70, // Adjust based on Header height
                                right: 20,
                                zIndex: 10,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 10,
                            }} >
                            <Typography variant="caption" fontWeight="bold">
                                {activeIndex + 1} / {mediaList.length}
                            </Typography>
                        </Box>
                    )}

                    {/* Header */}
                    <IsolatedHeader postType={postType} onBackClick={handleBackClick}
                        onMoreClick={handleMoreClick} hide={hideInfo} />

                    {/* Media Area */}
                    {MediaContent()}

                    {/* Footer */}
                    <IsolatedFooter isDesktop={isDesktop} postEngagment={postEngagment}
                        postHeader={postHeader} postCaption={postCaption} hideInfo={hideInfo} />
                </Stack >

                {/* Desktop Engagement Sidebar */}
                {isDesktop && postEngagment && !hideInfo && (
                    <Fade in={!hideInfo}>
                        <Box> {postEngagment} </Box>
                    </Fade>
                )}
            </Stack >
        </DoubleTap >
    )
};


