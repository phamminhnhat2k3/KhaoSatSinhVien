"use client";
import { useActionState } from "react";
import { actionFeedback, showActionToast } from "@/lib/action-feedback";
export function useActionFeedback<State>(action: (state: Awaited<State>, form: FormData) => State | Promise<State>, initial: Awaited<State>) {
  return useActionState(async (state: Awaited<State>, form: FormData) => {
    try {
      const result = await action(state, form);
      const feedback = actionFeedback(result);
      if (feedback) showActionToast(feedback.message, feedback.kind);
      return result;
    } finally { window.dispatchEvent(new Event("consume-action-feedback")); }
  }, initial);
}
