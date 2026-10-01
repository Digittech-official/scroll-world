// Single source of truth for practice details.
// Edit this file to update phone numbers, chambers or timings — every page reads from it.
// Sources: drritamroy.com (About page) and the public chamber listing published by the practice.

window.SITE = {
  doctor: {
    name: "Dr. Ritam Roy",
    title: "Consultant Physician & Diabetologist",
    degrees: "MBBS, MD (General Medicine)",
    alma: "IPGMER & SSKM Hospital, Kolkata",
    experienceYears: 15,
    region: "Kanchrapara & Kalyani, North 24 Parganas, West Bengal",
    phone: "+91 82829 01908",
    phoneRaw: "918282901908", // used for WhatsApp + tel: links (country code, no +)
    email: "your.ritam@gmail.com",
    photo: "assets/doctor.jpg", // drop a portrait here; a monogram shows until then
    social: {
      facebook: "https://www.facebook.com/drritamroymd/",
      x: "https://x.com/drritamroy"
    }
  },

  qualifications: [
    { label: "MBBS", detail: "IPGMER & SSKM Hospital, Kolkata" },
    { label: "MD — General Medicine", detail: "IPGMER & SSKM Hospital, Kolkata" },
    { label: "P.G. Dip. Diabetes & Endocrinology", detail: "Royal College of Physicians (UK)" },
    { label: "CCEBDM", detail: "Certificate Course in Evidence Based Diabetes Management — PHFI" },
    { label: "CCGDM", detail: "Certificate Course in Gestational Diabetes Mellitus — PHFI" },
    { label: "CCCKD", detail: "Certificate Course in Management of Chronic Kidney Disease — PHFI" }
  ],

  memberships: [
    "Association of Physicians of India (API)",
    "Research Society for the Study of Diabetes in India (RSSDI)",
    "Indian Medical Association (IMA)"
  ],

  // day: 0 = Sunday … 6 = Saturday. time is 24h "HH:MM" when the doctor starts seeing patients.
  chambers: [
    {
      id: "archana",
      name: "Archana Diagnostic Center",
      address: "107, Lenin Sarani, Kanchrapara, North 24 Pgs, WB",
      sessions: [
        { day: 0, time: "19:00" },
        { day: 4, time: "19:00" },
        { day: 6, time: "19:00" }
      ],
      phones: ["033 2585 5173", "98745 63356"],
      map: "https://maps.google.com/?q=107+Lenin+Sarani+Kanchrapara"
    },
    {
      id: "seva",
      name: "Seva Medical Hall",
      address: "Near Bagmore Bazar, Bagmore, Kanchrapara, North 24 Pgs, WB",
      sessions: [
        { day: 1, time: "16:00" },
        { day: 5, time: "16:00" }
      ],
      phones: ["70034 61228"],
      map: "https://maps.google.com/?q=Bagmore+Bazar+Kanchrapara"
    },
    {
      id: "ghosh",
      name: "Ghosh Pharmacy",
      address: "Laxmi Cinema More, Kanchrapara, North 24 Pgs, WB",
      sessions: [{ day: 5, time: "20:00" }],
      phones: ["70037 78243"],
      map: "https://maps.google.com/?q=Laxmi+Cinema+More+Kanchrapara"
    },
    {
      id: "octave",
      name: "Octave",
      address: "Bagmore, Kanchrapara, North 24 Pgs, WB",
      sessions: [{ day: 2, time: "11:00" }],
      phones: ["91630 42203"],
      map: "https://maps.google.com/?q=Bagmore+Kanchrapara"
    }
  ],

  booking: {
    // Optional: set to a Formspree / Google Apps Script / any JSON endpoint to also
    // receive bookings by email or in a sheet. WhatsApp confirmation always works.
    endpoint: "",
    daysAhead: 21
  }
};
