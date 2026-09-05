import { base44 } from "@/api/base44Client";

// רישום פעילות ליומן — best-effort ומיועד לא לחסום אף פעולה עסקית: אם
// הרישום עצמו נכשל, זה נרשם בקונסולה אבל לא מפריע למשתמש להמשיך.
export async function logActivity({ entity_type, entity_id, action, summary, amount }) {
  try {
    await base44.entities.ActivityLog.create({ entity_type, entity_id, action, summary, amount });
  } catch (e) {
    console.error("רישום ליומן הפעילות נכשל:", e);
  }
}
