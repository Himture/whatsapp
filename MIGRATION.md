# Migrating from another WhatsApp platform

Switching takes under an hour. Your WhatsApp account, phone number, and templates stay with Meta — they don't belong to the old platform. You're only migrating the data your old platform added on top: contacts, tags, and lists.

## From Wati

1. Log in to Wati → **Contacts** → click the **Export** button. Wati exports a CSV with columns `name`, `phone`, `tags`, `notes`.
2. Open our **Contacts** page → click **Import CSV** → upload the file.
3. Column mapping is automatic. Tags use semicolons in Wati — we convert them on import.
4. Templates stay where they are — they live on Meta's servers. Point our app at the same WABA and they appear.
5. Cancel your Wati subscription from **Billing → Cancel**. If you see the infamous "hidden" cancellation flow, email their support directly.

## From AiSensy

1. In AiSensy, go to **Contacts** → **Export Contacts** → choose CSV.
2. Columns exported: `Name`, `Phone Number`, `Tags`, `Custom Attributes`.
3. Import into our **Contacts** page. We match `Phone Number` → `phone` automatically.
4. Custom attributes become notes. You can split them into tags after import using the bulk tag tool (coming soon).
5. If you used AiSensy's chatbot flow builder, recreate the top three triggers in our **Flows** page. Most teams find the rule-based builder covers 80% of what they used.

## From Interakt

1. In Interakt → **Contacts** → **Export**. Choose CSV or XLSX.
2. Convert XLSX to CSV with Google Sheets if you exported XLSX.
3. Import into our **Contacts** page.
4. If you were paying for the Interakt **Sales CRM** add-on, note that we don't charge separately for contact management — it's included in every plan.

## Templates (any platform)

Templates live on Meta's WhatsApp Business Account, not on any platform. When you connect your WABA in our Settings, all your approved templates appear automatically in the **Templates** page. Nothing to migrate.

## Broadcast history

We don't import historical broadcasts from other platforms. Old metrics live in the old platform. New broadcasts sent from here appear in our **Analytics** going forward.

## What to expect during the switch

- **Zero downtime** — your WhatsApp number keeps sending and receiving. Our app connects to your existing WABA.
- **Webhook rewiring** — if you had webhooks pointed at the old platform, point them at our URL (shown in **Settings** next to each configuration). Meta allows only one webhook URL per WABA, so switching is a single update.
- **Quality rating is preserved** — your phone number's quality rating is a Meta-level attribute. It travels with the number, not the platform.

## Help

If you hit a snag, email migration@himture.dev with a line about your old platform and where you're stuck. We usually reply within a few hours.
