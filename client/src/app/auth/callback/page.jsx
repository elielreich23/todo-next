"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../contexts/UserContext";

const GOOGLE_SIGNUP_IDS_KEY = "taskero_google_signup_user_ids";
const NEW_ACCOUNT_WINDOW_MS = 60_000;

function getKnownGoogleSignupIds() {
  try {
    return JSON.parse(localStorage.getItem(GOOGLE_SIGNUP_IDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function rememberGoogleSignupId(userId) {
  const ids = new Set(getKnownGoogleSignupIds());
  ids.add(userId);
  localStorage.setItem(GOOGLE_SIGNUP_IDS_KEY, JSON.stringify([...ids]));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();

  useEffect(() => {
    const finishSignIn = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/auth/signin");
        return;
      }

      const supabaseUser = data.session.user;
      const isSignupFlow = searchParams.get("flow") === "signup";
      const createdAt = new Date(supabaseUser.created_at).getTime();
      const accountAgeMs = Date.now() - createdAt;
      const knownGoogleSignupIds = getKnownGoogleSignupIds();
      const hasCompletedSignupBefore =
        knownGoogleSignupIds.includes(supabaseUser.id) ||
        Boolean(supabaseUser.user_metadata?.taskero_google_signup_completed_at);
      const accountAlreadyExisted =
        hasCompletedSignupBefore || accountAgeMs > NEW_ACCOUNT_WINDOW_MS;

      console.info("[auth] Supabase Google callback", {
        flow: isSignupFlow ? "signup" : "signin",
        email: supabaseUser.email,
        created_at: supabaseUser.created_at,
        accountAgeMs,
        hasCompletedSignupBefore,
        accountAlreadyExisted,
      });

      if (isSignupFlow && accountAlreadyExisted) {
        await supabase.auth.signOut();
        setUser(null);
        router.replace("/auth/signin?reason=account-exists");
        return;
      }

      if (isSignupFlow) {
        rememberGoogleSignupId(supabaseUser.id);
        await supabase.auth.updateUser({
          data: {
            taskero_google_signup_completed_at: new Date().toISOString(),
          },
        });
      }

      const displayName =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email?.split("@")[0] ||
        "User";

      setUser({
        id: supabaseUser.id,
        username: supabaseUser.email?.split("@")[0] || supabaseUser.id,
        email: supabaseUser.email || "",
        full_name: displayName,
      });

      router.replace("/dashboard");
    };

    finishSignIn();
  }, [router, searchParams, setUser]);

  return (
    <div style={{ display: "grid", minHeight: "100vh", placeItems: "center" }}>
      Finishing sign in...
    </div>
  );
}
