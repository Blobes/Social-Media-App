"use client";

import React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  FileInput,
  InlineMsgUI,
  SelectedMediaFiles,
  TextInput,
  DisplayList as TopicList,
  TransText,
} from "@repo/shared-ui";
import { Content, FilesProps } from "./useGistContent";
import {
  COMMON_MEDIA,
  ITopic,
  ListType,
  POST_BUTTON_LABELS,
  POST_FEEDBACK,
  POST_INPUT,
} from "@repo/core";
import { GistContext } from "./CreateGist";
import { useStaticTranslation } from "@repo/shared-hooks";

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
  setStep,
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

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
    processingStates, // Extracted processing states containing live metrics
  } = gistContext;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(7.5),
      }}>
      <Stack sx={{ gap: theme.gap(2) }}>
        <TransText
          {...POST_FEEDBACK.compose_post}
          sx={{ ...theme.typography.subtitle1, color: theme.palette.gray[300] }}
        />
        {!isProcessing && inlineErrMsg && (
          <InlineMsgUI msg={inlineErrMsg} type="ERROR" />
        )}
        <TextInput
          variant="outlined"
          label={translateTxtString(POST_INPUT.label.whats_happening)}
          placeholder={translateTxtString(
            POST_INPUT.placeholder.share_your_thought,
          )}
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
          <TransText
            {...COMMON_MEDIA.added_media(stagedFiles.length)}
            sx={{
              ...theme.typography.body3,
              color: theme.palette.gray[200],
              fontWeight: 600,
            }}
          />
          <SelectedMediaFiles
            stagedFiles={stagedFiles}
            processingStates={processingStates || {}}
            onRemoveFile={handleRemoveFile}
            onPreviewClick={() => setStep?.("MEDIA_PREVIEW")}
          />
        </Stack>
      )}

      <Stack sx={{ gap: theme.gap(2.5) }}>
        <TransText
          {...COMMON_MEDIA.added_media(stagedFiles.length)}
          sx={{
            ...theme.typography.body3,
            color: theme.palette.gray[200],
            fontWeight: 600,
          }}
        />
        <TransText
          {...POST_FEEDBACK.categorization_taxonomy}
          sx={{
            ...theme.typography.body3,
            color: theme.palette.gray[200],
            fontWeight: 600,
          }}
        />
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
          <TransText {...POST_BUTTON_LABELS.post_add_topic} noComponent />
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
                    "&hover": { color: theme.palette.error.main },
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
        <TransText {...POST_BUTTON_LABELS.post_next} noComponent />
      </AppButton>
    </Box>
  );
};
