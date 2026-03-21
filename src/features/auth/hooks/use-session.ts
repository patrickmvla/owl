"use client";

import { authClient } from "@/features/auth/config/auth-client";

export const useSession = authClient.useSession;
