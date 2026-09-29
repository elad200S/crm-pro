// כשלקוח משלם לראשונה — יוצר לו התחברות אמיתית לפורטל באתר (heydigital.co.il)
// וסיסמה = הטלפון שלו, ושולח לו מייל עם הפרטים. best-effort: אם זה נכשל,
// התשלום עצמו כבר נשמר וזה לא אמור לחסום את המשתמש.
const PROVISION_URL = "https://dgsuukvywkxoecrpwddh.supabase.co/functions/v1/provision-client-account";

export async function provisionClientAccount({ name, email, phone }) {
  const secret = import.meta.env.VITE_PROVISION_SECRET;
  if (!secret) {
    console.warn("VITE_PROVISION_SECRET לא מוגדר — דילוג על יצירת התחברות אוטומטית ללקוח.");
    return;
  }
  if (!email || !phone) return;

  try {
    const res = await fetch(PROVISION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-provision-secret": secret,
      },
      body: JSON.stringify({ name, email, phone }),
    });
    if (!res.ok) {
      console.error("יצירת התחברות ללקוח נכשלה:", await res.text());
    }
  } catch (e) {
    console.error("יצירת התחברות ללקוח נכשלה:", e);
  }
}
