import { Stack, IconButton } from "@mui/material";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { AnimatedWrapper } from "@repo/shared-ui";
import { pulse } from "@repo/helpers";
import { red } from "@mui/material/colors";
import { useTheme } from "@mui/material/styles";
import { UIMode } from "@repo/core";

interface EngagementProps {
likedByMe: boolean;
isLiking: boolean;
handleLike: () => void;
mode?: UIMode;
}

export const GistEngagement = ({ likedByMe, isLiking, handleLike, mode }: EngagementProps) => {
const theme = useTheme();

    return (
        <Stack direction="row" sx={{
            padding: theme.boxSpacing(6, 0),
            [theme.breakpoints.down("md")]: {
                padding: theme.boxSpacing(4, 6),
            }
        }}>
            <Stack sx={{
                flexDirection: "row",
                gap: theme.gap(6),
                width: "100%",
                alignItems: "center",
                "& > button:hover": {
                    transform: "scale(1.08)",
                    transition: "transform 0.3s ease-in-out",
                    background: "none",
                }
            }}>

                {/* Like */}
                <IconButton sx={{
                    padding: theme.boxSpacing(0),
                    borderRadius: theme.radius[0]
                }} onClick={handleLike}>
                    <AnimatedWrapper
                        sx={{ ...(isLiking && { animation: `${pulse()} 0.3s linear ` }) }}>
                        <Heart size={26} style={{
                            fill: likedByMe ? (mode === "online" ? red[500] :
                                theme.palette.gray[200]) : "none",
                            stroke: likedByMe ?
                                (mode === "online" ? red[500] : theme.palette.gray[200])
                                : theme.palette.gray[200]
                        }} />
                    </AnimatedWrapper>
                </IconButton>

                {/* Comments */}
                <IconButton sx={{
                    padding: theme.boxSpacing(0),
                    borderRadius: theme.radius[0]
                }}><MessageCircle size={24} />
                </IconButton>

                {/* Share */}
                <IconButton sx={{
                    padding: theme.boxSpacing(0),
                    borderRadius: theme.radius[0]
                }}>
                    <Send size={24} />
                </IconButton>
            </Stack>

            {/* Bookmark */}
            <IconButton sx={{
                padding: theme.boxSpacing(0),
                borderRadius: theme.radius[0],
                "&:hover": {
                    transform: "scale(1.08)",
                    transition: "transform 0.3s ease-in-out",
                    background: "none"
                }
            }}> <Bookmark size={24} />
            </IconButton>
        </Stack>
    );

};
