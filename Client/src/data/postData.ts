"use client";

import { Post } from "./models";
const postPic1 = "/assets/images/postpic1.jpg";
const postPic2 = "/assets/images/postpic2.jpg";
const postPic3 = "/assets/images/postpic3.jpg";

export const postData: Post[] = [
  {
    id: "post1",
    authorId: "1",
    content: "Post 1 content",
    image: postPic1,
    likes: [],
    createdOn: Date.now(),
  },
  {
    id: "post2",
    authorId: "1",
    content: "Post 2 content",
    image: postPic2,
    likes: [],
    createdOn: Date.now(),
  },
  {
    id: "post3",
    authorId: "2",
    content: "Post 3 content",
    image: postPic3,
    likes: [],
    createdOn: Date.now(),
  },
];
