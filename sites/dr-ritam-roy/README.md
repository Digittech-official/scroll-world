# Dr. Ritam Roy — 3D practice website

A static, fast, real-time 3D website for **Dr. Ritam Roy, MBBS, MD (IPGMER & SSKM)**,
Consultant Physician & Diabetologist, Kanchrapara & Kalyani.

Built in the spirit of this repo's *scroll-world* idea: as you scroll, a camera flies through
one continuous 3D world (a Three.js scene rendered live in the browser). Each page section has
its own "station", and a stream of glowing cells links them all.

| Section | 3D station |
|---|---|
| Hero | Rotating DNA double helix |
| About | Credentials orb with orbiting rings |
| Areas of care | Cloud of glucose molecules |
| Health tools | Beating particle heart + ECG ring |
| Chambers | Map with a pin for each of the 4 chambers |
| Appointment | Sunrise orb with a ring of calendar tiles |
| Morning notes (blog) | Floating note pages |
| FAQ & contact | Calm wave field |

No build step, no framework. Three.js, marked and DOMPurify are vendored in `js/vendor/`.

## What's inside

- **Appointment booking.** Pick a chamber, then one of its real upcoming sessions (generated from
  the weekly schedule), then enter the patient's details. The request opens in WhatsApp to
  +91 82829 01908, ready to send, and the clinic replies with the serial number. Requests are
  remembered on the patient's own device. Optionally, set `booking.endpoint` in
  `js/site-data.js` to a Formspree or Google Apps Script URL to also get each booking by email
  or in a Google Sheet.
- **Daily blog ("Morning notes").** `blog.html` has search, topic filters, article pages,
  WhatsApp/Facebook sharing and a "New today" badge. Posts live in `blog/posts.json`.
- **Easy daily publishing.** `/admin` is a simple writing screen (Decap CMS). Dr. Roy logs in on
  his phone or laptop, adds a note, attaches a photo and presses **Publish**. The site updates
  in about a minute.
- **Health tools.** Indian Diabetes Risk Score (MDRF), HbA1c → estimated average glucose (ADAG),
  and BMI with Asian-Indian cut-offs.
- **Chambers & timings.** A weekly view that highlights today, plus call and map links for each chamber.
- SEO (schema.org `Physician`), mobile layout, reduced-motion support, keyboard-accessible pickers,
  and a fallback for devices without WebGL.

## Editing details

Everything about the practice (phone, email, chambers, timings, qualifications) is in
**`js/site-data.js`**. Change it once and every page updates.

To add a portrait, save it as **`assets/doctor.jpg`** (portrait orientation, about 960×1200).
The "RR" monogram shows until then.

## Run locally

```bash
cd sites/dr-ritam-roy
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publishing the daily blog (one-time setup, ~10 minutes)

1. Push this repo to GitHub. In Netlify, choose **Add new site → Import from Git**, select the
   repo and set **Base directory** to `sites/dr-ritam-roy`. `netlify.toml` handles the rest.
2. In Netlify go to **Site configuration → Identity → Enable**. Under **Registration** choose
   *Invite only*, then invite Dr. Roy's email.
3. Under **Identity → Services**, enable **Git Gateway**.
4. Dr. Roy accepts the invite, sets a password and then visits `https://<site>/admin/` every
   morning: **Morning notes → All notes → Add note → Publish**.

Not on Netlify? Change the `backend` block in `admin/config.yml` to `name: github` (instructions
are in the file). You can also edit `blog/posts.json` directly.

## Before going live: please review

- The live site (drritamroy.com) could not be reached from the build environment. The practice
  details come from the site's About page and its public chamber listing, as found through
  web search. **Please confirm phone numbers, chamber timings and addresses.**
- The three starter blog notes are sample health-education content written for launch. Dr. Roy
  should review, edit or replace them.
- No patient testimonials are included. Add only real, consented reviews.
