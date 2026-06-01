"use client";

import { PostType } from "@repo/core";
import React from "react";
import { CreateGist } from "../gist/create/CreateGist";

interface PostItem {
  postType: PostType;
  post: React.ReactNode;
}

export const CREATE_POST = {
  gist: <CreateGist />,
};
