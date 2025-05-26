"use client";

import {
  Box,
  Stack,
  Card,
  Typography,
  Divider,
  Button,
  IconButton,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import Image from "next/image";
import { UserAvatar } from "@/app/user/components/UserAvatar";
import { userData as users } from "@/data/userData";
import { Favorite, Share, More } from "@mui/icons-material";
import { useUser } from "@/app/user/userHooks";
import { GenericObject } from "../types";
