"use client";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  password: string;
  isAdmin?: boolean;
  coverImage?: string | "/assets/images/cover.jpg";
  followers: string[];
  following: string[];
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  image: string | null;
  likes: string[];
  createdOn: number;
}
