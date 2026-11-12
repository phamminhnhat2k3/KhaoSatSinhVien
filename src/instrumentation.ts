export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { db } = await import("@/lib/db");
  const { runAutomaticReminders } = await import("@/modules/notifications/automatic");
  const state = globalThis as typeof globalThis & { surveyReminderTimer?: ReturnType<typeof setInterval> };
  if (state.surveyReminderTimer) return;
  let running = false;
  const check = async () => {
    if (running) return;
    running = true;
    try { await runAutomaticReminders(db); }
    catch { console.error("Chưa kiểm tra được nhắc hạn khảo sát. Hệ thống sẽ thử lại ở lượt kế tiếp."); }
    finally { running = false; }
  };
  state.surveyReminderTimer = setInterval(() => { void check(); }, 15*60*1000);
  state.surveyReminderTimer.unref();
  void check();
}
