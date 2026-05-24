# AGENTS.md — Operating Manual for AI Coding Agents | دليل التشغيل للوكلاء البرمجيين الذكيين

> 📜 **Stack-wide protocol rules**: read [`AXIOM.md`](https://github.com/Moeabdelaziz007/aix-format/blob/main/AXIOM.md) first. This file complements it with repo-local operating instructions for the AxiomID project.

## 🇬🇧 English: Project Overview & Guidelines

### 1. Project Overview
`axiomid-project` is the **L0 Root Authority** of the AIX Sovereign Stack, serving as the official surface for [axiomid.app](https://axiomid.app). It implements the **Human Authorization Protocol**, focusing on decentralized identity verification for human-AI collaboration.

### 2. Architecture
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL / SQLite (via Prisma ORM)
- **Deployment**: Vercel
- **Authentication**: Web3-first (Wallet Connect) & Pi Network Integration

### 3. Identity System (did:axiom)
AxiomID issues decentralized identifiers in the format `did:axiom:axiomid.app:<id>`. Trust is built via a progressive XP-based tier system:
- **GHOST** (0 XP): Unverified.
- **SPARK** (100 XP): Verified human (socials connected).
- **PULSE** (500 XP): Active user (transaction history).
- **AXIOM** (1000 XP): Elite status (reputation & stakes).

### 4. Pi Network Integration
- **Validation**: Uses `public/validation-key.txt` for domain ownership.
- **Library**: Integration via `@axiom/pi` for KYC and payment flows.

### 5. Key Directories
- `src/app/`: Next.js App Router (pages and API routes).
- `src/lib/`: Core utilities, Prisma client, and business logic.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets and protocol manifests.

### 6. Coding Rules
- **Strict TypeScript**: No `any` types unless absolutely unavoidable.
- **Security**: Never hardcode secrets. Use `.env`.
- **API Design**: All API routes must implement error logging and proper status codes.
- **License**: Proprietary. Do not modify license headers.

### 7. Deployment
Automated via **GitHub Actions** triggering deployments to **Vercel**.

---

## 🇸🇦 العربية: نظرة عامة وقواعد المشروع

### 1. نظرة عامة على المشروع
مشروع `axiomid-project` هو **سلطة الجذر L0** لمجموعة AIX Sovereign Stack، وهو الواجهة الرسمية لـ [axiomid.app](https://axiomid.app). يقوم بتنفيذ **بروتوكول التفويض البشري**، مع التركيز على التحقق من الهوية اللامركزية للتعاون بين البشر والذكاء الاصطناعي.

### 2. البنية التحتية
- **إطار العمل**: Next.js 16 (App Router)
- **قاعدة البيانات**: PostgreSQL / SQLite (عبر Prisma ORM)
- **الاستضافة**: Vercel
- **المصادقة**: المحافظ الرقمية (Wallet Connect) وتكامل شبكة Pi.

### 3. نظام الهوية (did:axiom)
يصدر AxiomID معرفات لامركزية بصيغة `did:axiom:axiomid.app:<id>`. تُبنى الثقة عبر نظام مستويات يعتمد على نقاط الخبرة (XP):
- **GHOST** (0 XP): غير موثق.
- **SPARK** (100 XP): إنسان موثق (ربط الحسابات الاجتماعية).
- **PULSE** (500 XP): مستخدم نشط (تاريخ المعاملات).
- **AXIOM** (1000 XP): حالة النخبة (سمعة ورهانات عالية).

### 4. تكامل شبكة Pi Network
- **التحقق**: يستخدم `public/validation-key.txt` لإثبات ملكية النطاق.
- **المكتبة**: التكامل عبر `@axiom/pi` لتدفقات "اعرف عميلك" (KYC) والمدفوعات.

### 5. المجلدات الرئيسية
- `src/app/`: مسارات Next.js (الصفحات وواجهات البرمجية API).
- `src/lib/`: الأدوات الأساسية، عميل Prisma، ومنطق العمل.
- `prisma/`: مخطط قاعدة البيانات والترحيلات.
- `public/`: الأصول الثابتة وبيانات البروتوكول.

### 6. قواعد البرمجة
- **TypeScript صارم**: يمنع استخدام `any` إلا عند الضرورة القصوى.
- **الأمان**: لا تقم بتضمين الأسرار برمجياً. استخدم ملفات `.env`.
- **تصميم API**: يجب أن تنفذ جميع المسارات تسجيل الأخطاء ورموز الحالة الصحيحة.
- **الترخيص**: ملكية خاصة. لا تقم بتعديل ترويسات الترخيص.

### 7. النشر
يتم النشر تلقائياً عبر **GitHub Actions** التي ترسل التحديثات إلى **Vercel**.
