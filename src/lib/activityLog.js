import { base44 } from "@/api/base44Client";

// זיהוי קצר של דפדפן/מערכת הפעלה מתוך ה-user agent, לצורך תצוגה ביומן הפעילות
function getDeviceInfo() {
  if (typeof navigator === "undefined") return undefined;
  const ua = navigator.userAgent || "";
  let os = "לא ידוע";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "Mac";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "דפדפן";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  return `${browser} · ${os}`;
}

// רישום פעילות ליומן — best-effort ומיועד לא לחסום אף פעולה עסקית: אם
// הרישום עצמו נכשל, זה נרשם בקונסולה אבל לא מפריע למשתמש להמשיך.
export async function logActivity({ entity_type, entity_id, action, summary, amount }) {
  try {
    await base44.entities.ActivityLog.create({
      entity_type,
      entity_id,
      action,
      summary,
      amount,
      device_info: getDeviceInfo(),
    });
  } catch (e) {
    console.error("רישום ליומן הפעילות נכשל:", e);
  }
}
