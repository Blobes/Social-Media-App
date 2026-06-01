"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  FileInput,
  InlineMsg,
  TextInput,
  DisplayList as TopicList,
} from "@repo/shared-ui";
import { Content, FilesProps } from "./useGistContent";
import { ITopic, ListType } from "@repo/core";
import { GistMediaUpload } from "./MediaUpload";
import { GistContext } from "./CreateGist";

export interface GistStepProps extends Content {
  gistContext: GistContext;
}

/**
 * Standardized Material UI post layout consumer.
 */
export const GistContentStep: React.FC<GistStepProps & FilesProps> = ({
  caption,
  setCaption,
  stagedFiles,
  topics,
  gistContext,
}) => {
  const theme = useTheme();

  const {
    isProcessing,
    inlineErrMsg,
    handleFileSelection,
    handleNext,
    topicsMenuRef,
    topicSearchQuery,
    setTopicSearchQuery,
    availableTopicsList,
    isTopicsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    handleTopics,
    handleRemoveTopic,
    handleRemoveFile,
  } = gistContext;

  /**
   * Slices out item vectors from state indexes when triggered by overlay remove elements.
   */
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(7.5),
      }}>
      <Stack sx={{ gap: theme.gap(2) }}>
        <Typography variant="subtitle1" sx={{ color: theme.palette.gray[300] }}>
          Compose Gist
        </Typography>

        {!isProcessing && inlineErrMsg && (
          <InlineMsg msg={inlineErrMsg} type="ERROR" />
        )}

        <TextInput
          variant="outlined"
          label="What's happening?"
          placeholder="Share your technical discovery or insights..."
          value={caption}
          disabled={isProcessing}
          onChange={(e) => setCaption(e.target.value)}
        />
      </Stack>

      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.gap(4),
          width: "100%",
        }}>
        <FileInput
          onChange={handleFileSelection}
          disabled={isProcessing}
          selectedCount={stagedFiles.length}
        />
      </Stack>

      {stagedFiles.length > 0 && (
        <Stack sx={{ gap: theme.gap(3) }}>
          <Typography
            variant="body3"
            sx={{ color: theme.palette.gray[200], fontWeight: 600 }}>
            Added media ({stagedFiles.length})
          </Typography>

          <GistMediaUpload
            stagedFiles={stagedFiles}
            onRemoveFile={handleRemoveFile}
          />
        </Stack>
      )}

      <Stack sx={{ gap: theme.gap(2.5) }}>
        <Typography
          variant="body3"
          sx={{ color: theme.palette.gray[200], fontWeight: 600 }}>
          Categorization Taxonomy
        </Typography>

        <AppButton
          variant="outlined"
          onClick={(e) =>
            topicsMenuRef.current?.openMenu(e as unknown as HTMLElement)
          }
          options={{ disabled: isProcessing }}
          style={{
            alignSelf: "flex-start",
            fontSize: "13px",
            padding: "8px 16px",
          }}>
          Add Topics
        </AppButton>

        {topics.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: theme.gap(2),
              mt: theme.gap(1),
            }}>
            {topics.map((topicTitle) => (
              <Chip
                key={topicTitle}
                label={topicTitle}
                onDelete={() => handleRemoveTopic(topicTitle)}
                disabled={isProcessing}
                sx={{
                  backgroundColor: theme.palette.gray[50],
                  color: theme.palette.gray[300],
                  fontWeight: 500,
                  borderRadius: theme.radius[1],
                  "& .MuiChip-deleteIcon": {
                    color: theme.palette.error.light,
                    "&:hover": { color: theme.palette.error.main },
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Stack>

      <TopicList<ITopic>
        menuRef={topicsMenuRef}
        list={availableTopicsList}
        listName={ListType.TOPICS}
        showSearchBar
        externalSearchQuery={topicSearchQuery}
        onExternalSearchChange={setTopicSearchQuery}
        isLoading={isTopicsLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        stickToScreen={false}
        heightThreshold={65}
        style={{
          item: {
            padding: theme.boxSpacing(4, 8),
            gap: "10px",
            borderRadius: 0,
            "& svg": { width: "16px", height: "16px" },
          },
          container: {
            padding: 0,
          },
        }}
        onItemClick={(item) => handleTopics(item)}
      />

      <AppButton
        variant="contained"
        onClick={handleNext}
        options={{
          disabled: isProcessing,
        }}
        style={{
          padding: theme.boxSpacing(6, 0),
          gap: "10px",
        }}>
        <Typography variant="button">Next</Typography>
      </AppButton>
    </Box>
  );
};
