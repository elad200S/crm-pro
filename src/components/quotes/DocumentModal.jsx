import React, { useState, useRef, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Tag, User, LayoutTemplate } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VARIABLES = [
  { key: "{customer-name}",     label: "שם לקוח",   autoField: "full_name" },
  { key: "{customer-id}",       label: 'ח"פ / ת"ז', autoField: "id_number" },
  { key: "{customer-email}",    label: "מייל",       autoField: "email" },
  { key: "{customer-phone}",    label: "טלפון",      autoField: "phone" },
  { key: "{customer-business}", label: "שם העסק",   autoField: "company_name" },
  { key: "{customer-address}",  label: "כתובת העסק", autoField: "business_address" },
  { key: "{current-date}",      label: "תאריך היום", autoField: "__date__" },
  { key: "{price}",             label: "מחיר",       autoField: "__price__" },
  { key: "{signature}",         label: "חתימה",      autoField: "__sig__" },
];

const DEFAULT_BODY = `בין: HEY DIGITAL (ע.מ. 325172823)
מרחוב קינג ג'ורג' 72, תל אביב
טלפון: 054-7108219 | דוא"ל: eladauto66@gmail.com
(להלן: "הספק" ו/או "החברה")
מצד אחד

לבין: {customer-name} (ח.פ./ע.מ. {customer-id})
מרחוב {customer-address}
טלפון: {customer-phone} | דוא"ל: {customer-email}
שם העסק: {customer-business}
(להלן: "המזמין" ו/או "הלקוח")
מצד שני

הואיל והחברה עוסקת, בין היתר, במתן שירותי אפיון, פיתוח, עיצוב ותחזוקת אתרי אינטרנט, מערכות מידע ואוטומציות;
והואיל והמזמין פנה לחברה בבקשה לקבלת שירותי הקמה ותחזוקה של אתר אינטרנט עבור עסקו (להלן: "הפרויקט"), בהתאם למפרט השירותים המפורט בהסכם זה;
והואיל והחברה מצהירה כי יש ברשותה הידע, הכלים והכישורים הנדרשים לביצוע הפרויקט, והיא מסכימה לספק שירותים אלו למזמין בכפוף לתנאי הסכם זה;

לפיכך, הוסכם, הותנה והוצהר בין הצדדים כדלקמן:

1. מבוא, פרשנות ומסמכי ההסכם
1.1. המבוא להסכם זה ונספחיו מהווים חלק בלתי נפרד הימנו.
1.2. כותרות הסעיפים נועדו לנוחות בלבד ולא ישמשו לפרשנות ההסכם.
1.3. הסכם זה מבטל כל מצג, הבטחה, טיוטה או הבנה קודמת, בכתב או בעל פה, שנעשו בין הצדדים עובר לחתימתו. כל שינוי בהסכם ייעשה בכתב בלבד ובחתימת שני הצדדים.

2. הצהרות המזמין והגדרת הפרויקט (AS-IS)
2.1. המזמין מצהיר כי הוא עוסק מורשה ו/או חברה הרשומה כחוק, וכי התקשרותו בהסכם זה נעשית לצרכים עסקיים-מסחריים טהורים לצורך עיסוקו, ולא לשימוש אישי, ביתי, משפחתי או צרכני.
2.2. המזמין מאשר כי בחן את טיב השירותים, הפלטפורמות ומערכות הניהול שמספקת החברה, ומצא אותם מתאימים לצרכיו ומטרותיו, כמות שהם (AS-IS), והוא מוותר בזאת על כל טענת אי-התאמה או פגם, ככל שאינה נובעת ממעשה או מחדל בזדון או ברשלנות חמורה של החברה.
2.3. המזמין מצהיר כי הוא רשום כחוק בביטוח הלאומי, במס הכנסה ובכל רשות נדרשת על פי דין, ומתחייב לשמור על מצבו המשפטי כאמור לאורך כל תקופת הסכם זה.
2.4. הצדדים מצהירים ומתחייבים כי אין כל מניעה משפטית, חוזית, חוקית או אחרת המונעת מהם מלהתקשר בהסכם זה ולמלא את התחייבויותיהם כלפי הצד השני, וכי יעשו כל שביכולתם על מנת לקיימו.

3. היקף השירותים ותהליך העבודה
3.1. החברה תספק למזמין חבילת הקמה הכוללת: רכישת שם מתחם (דומיין), אחסון בשרתי החברה, אבטחה מקיפה (תעודת SSL), עיצוב לוגו, 12 תלכידים גרפיים, 12 מאמרי תוכן לקידום אורגני (SEO), ממשק משתמש רספונסיבי, חיבור לרשתות חברתיות (פייסבוק/אינסטגרם/טיקטוק), וחייגן מהיר לטלפון וקישור ישיר לוואטסאפ (להלן: "חבילת ההקמה").
3.2. המזמין מתחייב להעביר לחברה את כלל חומרי הגלם הנדרשים (תמונות, טקסטים, מפרטים) בתוך 7 ימי עסקים ממועד חתימת הסכם זה. החברה תמסור סקיצה ראשונית עד 14 ימי עסקים ממועד קבלת מלוא החומרים. שינויים בסקיצה יתבצעו תוך 7 ימי עסקים מרגע קבלת הערות בכתב.
3.3. כל עיכוב מצד המזמין במסירת החומרים או במתן אישורים לסקיצות, לא יהווה עילה לדחיית מועדי התשלום הקבועים בהסכם זה ולא ייחשב כהפרה מצד החברה.
3.4. עם העלאת האתר לאוויר ומסירתו, ניהולו השוטף של האתר יחול על המזמין. כל דרישה לשינוי, פיתוח נוסף או עיצוב מעבר לאמור בסעיף 3.1, תתומחר בנפרד ותעוגן בהזמנת עבודה חדשה.
3.5. המזמין אחראי לכל תוכן ופעילות המתפרסמים באתר מטעמו, לרבות עמידה בדין ובתקנות צדדים שלישיים. המזמין אחראי לגיבוי כל התכנים שמסר או שהוטמעו באתר; לחברה לא תהא אחריות לאובדן נתונים מכל סיבה שהיא.
3.6. ניתן לרכוש תוספות לאתר בתשלום חודשי נפרד (כגון נגישות, מסוף סליקה וכיו"ב). תוספות אלו הינן באחריות צדדים שלישיים בלבד, אינן חלק ממערכות החברה, ולחברה אין שליטה או גישה אליהן. חיוב עבור תוספת כאמור יתבצע באופן אוטומטי במועד הוספתה.

4. תמורה, תנאי תשלום ומדיניות ביטולים
4.1. דמי הקמה: בגין חבילת ההקמה, ישלם המזמין לחברה סך של {price} בתוספת מע"מ כדין. התשלום יבוצע מראש, וניתן לחלוקה לעד 10 תשלומים שווים בכפוף לאישור אמצעי התשלום ותנאי חברת הסליקה.
4.2. דמי תחזוקה מתחדשים: ככל שסוכם בין הצדדים על מתן שירותי תחזוקה חודשיים, יחויב המזמין בסך שיסוכם מראש, בתוספת מע"מ מדי חודש, באמצעות חיוב אשראי אוטומטי. הפסקת החיוב תתאפשר בהודעה מוקדמת בכתב של 30 יום טרם מועד החידוש.
4.3. חתימת המזמין על הסכם זה מהווה הרשאה בלתי חוזרת לחברה לחייב את אמצעי התשלום שמסר, לצורך גביית כל סכום המגיע לפי הסכם זה, לרבות חיובים חוזרים כאמור בסעיף 4.2.
4.4. היעדר זכות להחזר (No Refund Policy): לאור הקצאת המשאבים המיידית (רכישת רישיונות, זמן אפיון ותחילת פיתוח), ביטול ההסכם לאחר תחילת העבודה ו/או האפיון לא יזכה את המזמין בהחזר כספי כלשהו. שירותי החברה מהווים יחידה שלמה (Bundle), ואי-ניצול חלקי של רכיבים מצד המזמין אינו מקים זכות לקיזוז או להשבה.
4.5. סנקציות בגין פיגור בתשלום: כל סכום שלא ישולם במועדו, בחריגה העולה על 7 ימים, יישא ריבית פיגורים בשיעור הריבית החריגה המרבית הנהוגה בבנק ישראל, בתוספת הצמדה למדד כדין. בנוסף, לחברה תעמוד הזכות להשהות את מתן השירותים ולהוריד את האתר מהאוויר לאלתר, עד לסילוק מלוא החוב, מבלי שהדבר ייחשב להפרת הסכם מצדה.
4.6. כלל השירותים הכלולים בחבילת ההקמה עומדים לרשות המזמין לתקופה של עד 12 חודשים ממועד רכישת העסקה. אי פנייה למימוש שירות מתוך החבילה, כולו או חלקו, לא יזכה את המזמין בהחזר כספי, זיכוי, קיזוז או ביטול מכל סוג. החבילה נמכרת כמכלול אחד, ולא ניתן לייחס שווי נפרד לרכיב בודד מתוכה.
4.7. ככל שקיים תשלום חודשי מתחדש כאמור בסעיף 4.2, הוא ייגבה עבור חודש מלא או חלק ממנו, ללא קשר למועד בקשת הביטול או להיקף השימוש בפועל באותו חודש.
4.8. התשלום לפי הסכם זה אינו כולל כל מוצר או שירות שלא פורט במפורש בהסכם, לרבות ובין היתר: ייעוץ משפטי/תקנון עריכת דין, תעודת נגישות, תעודת אבטחה נוספת, או שיווק/פרסום ממומן.

5. זכויות קניין רוחני
5.1. קניין המזמין: כל זכויות היוצרים בחומרי הגלם שהעביר המזמין (תמונות, טקסטים שסופקו על ידו, לוגו) הינן בבעלותו הבלעדית, והוא מצהיר כי שימוש החברה בהם אינו מפר זכויות צד ג'. המזמין ישפה את החברה בגין כל נזק, הפסד או הוצאה (לרבות שכ"ט עו"ד) שייגרמו לה עקב תביעת צד ג' בקשר לחומרים אלו.
5.2. קניין החברה: קוד המקור של האתר, אלגוריתמים, תשתיות פיתוח, סקריפטים, תבניות עיצוב (Templates) ושיטות עבודה, הינם ויישארו קניינה הרוחני הבלעדי של החברה. עם גמר התשלום המלא, מוענק למזמין רישיון שימוש אישי, בלתי הדיר ובלתי עביר בתוצר הסופי, אך ורק לצורך הפעלת עסקו.
5.3. החברה רשאית להציג את הפרויקט כחלק מתיק העבודות שלה (אתר, רשתות חברתיות, פרזנטציות), אלא אם המזמין הודיע בכתב על התנגדותו.
5.4. החברה רשאית להשתמש במידע שתפיק במסגרת מתן השירותים, לפי שיקול דעתה הבלעדי, ללא צורך בקבלת אישור או דיווח למזמין.

6. אחריות, שיפוי והגבלת חבות
6.1. פטור בגין שירותי צד ג': החברה מספקת את שירותיה תוך הסתמכות על תשתיות ענן, תוספים, שירותי סליקה ומערכות צד שלישי. החברה מוסרת כל אחריות בגין נזק, אובדן מידע, הפסד הכנסה או השבתת האתר הנובעים מכשל, קריסה או שינוי מדיניות של כל צד שלישי כאמור.
6.2. תקרת חבות: אחריותה המצטברת המקסימלית של החברה כלפי המזמין בגין כל נזק ישיר בקשר להסכם זה, לא תעלה בשום מקרה על סך התמורה ששולמה לחברה בפועל על ידי המזמין במסגרת הסכם זה. לחברה לא תהא כל אחריות לנזקים עקיפים, תוצאתיים או לאובדן רווחים. אין באמור כדי לפטור את החברה מאחריות לנזק גוף או לנזק שנגרם בזדון או ברשלנות חמורה, ככל שלא ניתן לפטור מאחריות כאמור על פי דין.
6.3. החברה אינה מתחייבת כי השירות יינתן ללא טעויות או הפרעות, וכי השימוש באתר יניב למזמין תוצאות עסקיות או כספיות מסוימות.
6.4. המזמין מוותר בזאת מראש על כל טענה, תביעה או דרישה כלפי החברה בקשר לתכונות השירותים, היקפם, עדכניותם, מגבלותיהם או התאמתם לצרכיו ודרישותיו, למעט במקרה של זדון או רשלנות חמורה מצד החברה.
6.5. המזמין אחראי הבלעדי לכל נזק, הוצאה כספית, הפסד או תלונה שעלולים לעמוד למי מהצדדים בגין פעילות האתר המופעל באמצעותו, לרבות פעילות בלתי חוקית, אשר האחריות לה חלה על המזמין בלבד.
6.6. ביחס לשירותי חייגן, וואטסאפ, מסופי סליקה ותוספים אחרים - מודגש כי אלו ניתנים למזמין באמצעות תוכנות ורישיונות של צדדים שלישיים. המזמין מתחייב לפעול לפי תקנון הצד השלישי הרלוונטי, ולחברה לא תהא כל אחריות במקרה של השבתת פעילות המזמין בתוכנת צד ג' או בגין כל נזק (ישיר או עקיף), הוצאה או הפסד שייגרמו למזמין כתוצאה מכך.
6.7. החברה רשאית להיעזר בצדדים שלישיים וקבלני משנה לצורך מתן השירותים. חתימת המזמין על הסכם זה מהווה הסכמתו למסירת נתוניו לצדדים כאמור, ככל שיידרש לצורך מתן השירותים.

7. ניתוק יחסי עובד-מעביד
7.1. היחסים בין הצדדים הינם יחסי קבלן עצמאי ומזמין שירות בלבד. בשום שלב לא יחולו יחסי עובד-מעביד, שליחות או שותפות בין הצדדים או מי מטעמם.

8. כוח עליון (Force Majeure)
8.1. החברה לא תישא באחריות לעיכוב או אי-ביצוע של התחייבויותיה עקב נסיבות שאינן בשליטתה הסבירה, לרבות תקלות תקשורת לאומיות, מלחמה, פעולות איבה, מגפות, שביתות כלליות ואסונות טבע.

9. שונות וסמכות שיפוט
9.1. המזמין אינו רשאי להמחות, להעביר או לשעבד את זכויותיו והתחייבויותיו על פי הסכם זה לצד שלישי, אלא בהסכמת החברה מראש ובכתב.
9.2. הודעות. כתובות הצדדים לצורך הסכם זה הן כמפורט לעיל. הודעה תיחשב כתקפה: (א) אם נמסרה אישית לכתובת הצד השני - ביום העסקים שלמחרת המסירה; (ב) אם נשלחה בדואר רשום - בתום 5 ימי עסקים ממועד המשלוח; (ג) אם נשלחה בדוא"ל - ביום העסקים שלמחרת אישור קבלתה.
9.3. על הסכם זה יחולו אך ורק דיני מדינת ישראל, וסמכות השיפוט המקומית והבלעדית בכל סכסוך הנובע ממנו תהא נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו בלבד.

ולראיה באו הצדדים על החתום:

{current-date}

חתימת וחותמת החברה — HEY Digital                חתימת המזמין: {signature}`;

// מזהה אילו משתנים קיימים בטקסט ואין להם ערך אוטומטי מהליד
const detectMissingVars = (body, lead) => {
  return VARIABLES.filter(v => {
    if (!body.includes(v.key)) return false;          // לא בשימוש בטקסט
    if (v.autoField === "__date__") return false;     // תאריך — אוטומטי
    if (v.autoField === "__price__") return false;    // מחיר — בשדה נפרד
    if (v.autoField === "__sig__") return false;      // חתימה — placeholder
    if (v.autoField && lead?.[v.autoField]) return false; // יש ערך בליד
    return true;                                       // חסר
  });
};

export default function DocumentModal({ doc, lead, onSubmit, onClose }) {
  const isNew = !doc?.id;
  const hasLead = !!lead;
  const entityName = lead?.full_name || null;
  const textareaRef = useRef();

  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    base44.entities.Quote.list('-created_date', 100).then(all => {
      setTemplates(all.filter(q => q.status === "תבנית" && !q.lead_id && !q.customer_id));
    }).catch(e => console.error("טעינת תבניות מסמך נכשלה:", e));
  }, []);

  const [form, setForm] = useState({
    title: doc?.title || "",
    body: doc?.notes || (isNew ? DEFAULT_BODY : ""),
    price: doc?.amount || "",
    valid_until: doc?.valid_until || "",
  });

  // שדות ידניים שהמשתמש ימלא
  const [manualVars, setManualVars] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setVar = (k, v) => setManualVars(m => ({ ...m, [k]: v }));

  // משתנים חסרים (לא ממולאים מהליד)
  const missingVars = useMemo(
    () => hasLead ? detectMissingVars(form.body, lead) : [],
    [form.body, lead]
  );

  // מוסיף משתנה לתוך הטקסט במיקום הסמן
  const insertVar = (varKey) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newBody = form.body.slice(0, start) + varKey + form.body.slice(end);
    set("body", newBody);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  const handleSubmit = async () => {
    // מונע יצירת מסמכים כפולים מלחיצה חוזרת בזמן שהשמירה הקודמת עוד
    // מתבצעת ברקע (Quote.create + עדכון ליד + webhook + התראה — כמה שניות)
    if (!form.title.trim() || submitting) return;
    setSubmitting(true);
    // שמור את הערכים הידניים בתוך הטקסט לפני שמירה
    let finalBody = form.body;
    Object.entries(manualVars).forEach(([key, val]) => {
      if (val) finalBody = finalBody.replaceAll(key, val);
    });
    try {
      await onSubmit({
        title: form.title,
        notes: finalBody,
        amount: parseFloat(form.price) || 0,
        valid_until: form.valid_until,
        status: "טיוטה",
        items: [],
        discount: 0,
        vat_included: false,
        currency: "ILS",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="w-5 h-5 text-brand-600" />
            {isNew ? "מסמך חדש" : "עריכת מסמך"}
            {entityName && <span className="text-sm font-normal text-gray-400">— {entityName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* בחירת תבנית */}
          {isNew && templates.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5 mb-2">
                <LayoutTemplate className="w-3.5 h-3.5" />
                בחר תבנית קיימת
              </p>
              <Select onValueChange={(val) => {
                const t = templates.find(t => t.id === val);
                if (t) {
                  set("title", t.title || "");
                  set("body", t.notes || "");
                  set("price", t.amount || "");
                }
              }}>
                <SelectTrigger className="h-8 text-sm bg-white">
                  <SelectValue placeholder="בחר תבנית..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* כותרת */}
          <div className="space-y-1.5">
            <Label>כותרת המסמך *</Label>
            <Input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="לדוגמה: הסכם שירות — אוטומציה"
            />
          </div>

          {/* שדות ידניים — רק כשיש ליד ויש משתנים חסרים */}
          {hasLead && missingVars.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-3">
                <User className="w-3.5 h-3.5" />
                פרטי לקוח חסרים — מלא לפני שליחה
              </p>
              <div className="grid grid-cols-2 gap-3">
                {missingVars.map(v => (
                  <div key={v.key} className="space-y-1">
                    <Label className="text-xs text-amber-800">{v.label}</Label>
                    <Input
                      value={manualVars[v.key] || ""}
                      onChange={e => setVar(v.key, e.target.value)}
                      placeholder={v.label}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* משתנים זמינים (כשלא יש ליד — עורכים תבנית) */}
          {!hasLead && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-brand-600 flex items-center gap-1 mb-2">
                <Tag className="w-3.5 h-3.5" /> משתנים — לחץ להוספה בטקסט
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVar(v.key)}
                    className="px-2 py-1 text-xs bg-white border border-brand-200 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors font-mono"
                  >
                    {v.key} <span className="text-gray-400 font-sans">({v.label})</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-brand-400 mt-2">ערכים אלו יתמלאו אוטומטית מנתוני הליד בעת יצירת מסמך ללקוח</p>
            </div>
          )}

          {/* תוכן */}
          <div className="space-y-1.5">
            <Label>תוכן המסמך</Label>
            <Textarea
              ref={textareaRef}
              rows={16}
              value={form.body}
              onChange={e => set("body", e.target.value)}
              placeholder="כתוב כאן את תוכן הסכם העבודה..."
              className="resize-y font-mono text-sm leading-relaxed"
              dir="rtl"
            />
          </div>

          {/* מחיר + תוקף */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>מחיר (₪)</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>בתוקף עד</Label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={e => set("valid_until", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            className="bg-brand-600 hover:bg-brand-700"
            onClick={handleSubmit}
            disabled={!form.title.trim() || submitting}
          >
            {submitting ? "שומר..." : isNew ? "צור מסמך" : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
