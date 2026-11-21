# Launch kit

## Positioning

*An independent creative application built during the AlDiwan API's launch window.*
Never claim to be "the first" integration; "among the earliest" is true and defensible.

## 45–60 second demonstration script

| # | Beat | On screen |
|---|---|---|
| 1 | Search | Type «المتنبي» in the hero search, results appear |
| 2 | Open | Click a poem; the reader shows poet, era, meter, rhyme |
| 3 | Metadata | Hover the meta row, then the attribution line |
| 4 | Full poem | Scroll the hemistich layout; the folio and verse numbers |
| 5 | Studio | «صمّم هذه القصيدة» → studio opens with the poem |
| 6 | Compose | Pick verses, switch Classical → Editorial → Artistic, change the face and palette |
| 7 | Export | Download the PNG, show the file at 1080×1350 with the credit line |
| 8 | Inspector | Open «لوحة الطلبات»: GET /poems/…, 200, latency, request-id, quota remaining |

Record at 1440×900, cursor visible, no voice-over needed — the app tells the story.

## Launch post (reply to the AlDiwan announcement)

> بنينا شيئًا على واجهة الديوان الجديدة.
>
> **ستوديو الديوان** — مساحة مجانية لاكتشاف الشعر العربي الكلاسيكي وتصميمه.
>
> ابحث في الشعر والشعراء، تنقّل بين العصور والبحور والقوافي، اختر قصيدة، ثم حوّلها إلى لوحة مطبوعة جاهزة للتصدير.
>
> تعمل على واجهة الديوان (14 مسارًا): البحث، الشعراء، القصائد، الاقتباسات، العصور، البحور، القوافي.
>
> مشروع مستقل من المجتمع، بُني خلال نافذة إطلاق الواجهة.
>
> التجربة: https://diwan-studio.web.app
> المصدر: https://github.com/rrmanx/diwan-studio
>
> @AldiwanNet

## Permission ask (DM / email to the AlDiwan team)

> نستخدم واجهتكم في «ستوديو الديوان»: القارئ يعرض النصّ مع الإسناد كما تعيده الواجهة، ونحتفظ
> بالاستجابات ٢٤ ساعة كحد أقصى، ولا نخزّن المدوّنة.
>
> نطلب إذنًا مكتوبًا لتمكين **تصدير النصّ القادم من الواجهة** كصورة للتواصل الاجتماعي، مع إسناد
> الديوان ورابطه داخل كل صورة. حتى ذلك الحين، التصدير مفتوح للنصوص التراثية العامة ولنصوص
> المستخدم فقط.

## Endpoint coverage

14/14 — see [API-MAP.md](API-MAP.md). The integration page in the app (`/api`) lists them with status,
the architecture diagram, quota economics and the connect steps.

## Before public launch

1. Get a verified Free API key; run the smoke test in `~/Downloads/check-out/aldiwan-api/REPORT.md` §9.
2. Deploy the Worker with the key as a secret; switch `VITE_DATA_SOURCE=live`; verify the inspector.
3. Proofread the preview corpus (classical texts) with an Arabic editor.
4. Ask for permission to export API text.
5. Record the demo, publish the repo, post the reply, and email the team.
