(function () {
  "use strict";
  var S = window.SITE;
  var D = S.doctor;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtTime(t) {
    var p = t.split(":"), h = +p[0], m = p[1];
    return ((h % 12) || 12) + (m === "00" ? "" : ":" + m) + " " + (h < 12 ? "AM" : "PM");
  }
  function wa(text) {
    return "https://wa.me/" + D.phoneRaw + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* ---------- static fills ---------- */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  var hw = $("#heroWhatsapp"); if (hw) hw.href = wa("Hello Dr. Roy's clinic, I'd like to know about appointments.");
  var camp = $("#campLink"); if (camp) camp.href = wa("Hello Dr. Roy, we would like to request a free health camp at our locality. Location: ");
  if ($("#cPhone")) {
    $("#cPhone").href = "tel:+" + D.phoneRaw; $("#cPhone").textContent = D.phone;
    $("#cWa").href = wa("Hello Dr. Roy's clinic,");
    $("#cEmail").href = "mailto:" + D.email; $("#cEmail").textContent = D.email;
    $("#cRegion").textContent = D.region;
    $("#sFb").href = D.social.facebook; $("#sX").href = D.social.x;
  }
  var creds = $("#creds");
  if (creds) creds.innerHTML = S.qualifications.map(function (q) {
    return "<li><strong>" + esc(q.label) + "</strong><span>" + esc(q.detail) + "</span></li>";
  }).join("");
  var mem = $("#memberships");
  if (mem) mem.innerHTML = S.memberships.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");

  // Portrait: show the photo if one exists, otherwise keep the monogram.
  var img = $("#doctorPhoto");
  if (img) {
    img.onload = function () { img.hidden = false; $("#monogram").hidden = true; };
    img.src = D.photo;
  }

  /* ---------- nav ---------- */
  var nav = $("#nav"), toggle = $("#navToggle"), links = $("#navLinks");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- scroll: progress, rail, active link ---------- */
  var stations = [].slice.call(document.querySelectorAll(".station"));
  var rail = $("#rail");
  if (rail) {
    stations.forEach(function (s) {
      var li = document.createElement("li");
      li.title = s.id;
      li.addEventListener("click", function () { s.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); });
      rail.appendChild(li);
    });
  }
  var bar = $("#progressBar");
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? scrollY / max : 0;
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    if (nav) nav.classList.toggle("scrolled", scrollY > 30);
    var mid = innerHeight * 0.45, cur = 0;
    stations.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) cur = i; });
    if (rail) [].forEach.call(rail.children, function (li, i) { li.classList.toggle("on", i === cur); });
    if (links && stations[cur]) {
      [].forEach.call(links.querySelectorAll("a"), function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + stations[cur].id);
      });
    }
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal + counters ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  function observe(el) { if (io) io.observe(el); else el.classList.add("in"); }
  [].forEach.call(document.querySelectorAll(".reveal"), observe);

  [].forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    var end = +el.dataset.count;
    if (reduced) { el.textContent = end; return; }
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 500);
  });

  // Subtle 3D tilt on cards (pointer devices only).
  if (!reduced && matchMedia("(hover: hover)").matches) {
    [].forEach.call(document.querySelectorAll(".card, .post-card"), function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = "perspective(800px) rotateY(" + x * 8 + "deg) rotateX(" + -yy * 8 + "deg) translateZ(6px)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }

  /* ---------- health tools ---------- */
  var idrs = $("#idrs");
  if (idrs) idrs.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = idrs.elements, waist = parseFloat(f.waist.value);
    if (!(waist > 0)) { f.waist.setAttribute("aria-invalid", "true"); f.waist.focus(); return; }
    f.waist.removeAttribute("aria-invalid");
    var male = f.sex.value === "m";
    var w = male ? (waist >= 100 ? 20 : waist >= 90 ? 10 : 0) : (waist >= 90 ? 20 : waist >= 80 ? 10 : 0);
    var score = +f.age.value + w + +f.act.value + +f.fam.value;
    var lvl = score >= 60 ? ["high", "High risk", "Please get a fasting sugar and HbA1c test done and book a consultation."]
      : score >= 30 ? ["mid", "Moderate risk", "A yearly sugar test and a more active routine are recommended."]
      : ["low", "Low risk", "Keep it up — stay active and check your sugar every 2–3 years."];
    $("#idrsOut").innerHTML = '<span class="score">' + score + '</span><span class="tag ' + lvl[0] + '">' + lvl[1] +
      "</span><p>" + lvl[2] + (score >= 30 ? ' <a href="#book">Book a check-up →</a>' : "") + "</p>";
  });

  var a1c = $("#a1c");
  function a1cUpdate() {
    var v = parseFloat(a1c.value), eag = Math.round(28.7 * v - 46.7);
    $("#a1cVal").textContent = v.toFixed(1) + "%";
    $("#a1cBar").style.left = "calc(" + ((v - 4) / 10 * 100) + "% - 2px)";
    var note = v < 5.7 ? ["low", "Normal range"] : v < 6.5 ? ["mid", "Prediabetes range"] : v <= 7 ? ["low", "At common target"] : ["high", "Above usual target"];
    $("#a1cOut").innerHTML = '<span class="score">' + eag + ' <small style="font-size:1rem">mg/dL</small></span><span class="tag ' +
      note[0] + '">' + note[1] + "</span><p>Estimated average glucose over the last ~3 months. Your personal target may differ.</p>";
  }
  if (a1c) { a1c.addEventListener("input", a1cUpdate); a1cUpdate(); }

  var bmi = $("#bmi");
  if (bmi) bmi.addEventListener("submit", function (e) {
    e.preventDefault();
    var h = parseFloat(bmi.elements.h.value) / 100, w = parseFloat(bmi.elements.w.value);
    if (!(h > 0.8 && w > 10)) return;
    var b = w / (h * h);
    var c = b < 18.5 ? ["mid", "Underweight"] : b < 23 ? ["low", "Healthy"] : b < 25 ? ["mid", "Overweight"] : ["high", "Obese"];
    var lo = (18.5 * h * h).toFixed(0), hi = (22.9 * h * h).toFixed(0);
    $("#bmiOut").innerHTML = '<span class="score">' + b.toFixed(1) + '</span><span class="tag ' + c[0] + '">' + c[1] +
      "</span><p>Healthy weight for your height (Asian Indian cut-offs): " + lo + "–" + hi + " kg.</p>";
  });

  /* ---------- schedule ---------- */
  var week = $("#week");
  if (week) {
    var today = new Date().getDay();
    var order = [1, 2, 3, 4, 5, 6, 0];
    week.innerHTML = order.map(function (d) {
      var slots = [];
      S.chambers.forEach(function (c) {
        c.sessions.forEach(function (s) { if (s.day === d) slots.push({ t: s.time, c: c }); });
      });
      slots.sort(function (a, b) { return a.t < b.t ? -1 : 1; });
      return '<div class="day' + (d === today ? " today" : "") + '"><h4>' + DAYS[d].slice(0, 3) + (d === today ? " · Today" : "") + "</h4>" +
        (slots.length ? slots.map(function (s) { return '<div class="slot"><b>' + fmtTime(s.t) + "</b>" + esc(s.c.name) + "</div>"; }).join("")
          : '<p class="none">No chamber</p>') + "</div>";
    }).join("");
  }
  var list = $("#chamberList");
  if (list) {
    list.innerHTML = S.chambers.map(function (c) {
      var when = c.sessions.map(function (s) { return DAYS[s.day].slice(0, 3); }).join(", ") + " · from " + fmtTime(c.sessions[0].time);
      return '<article class="panel chamber reveal"><h3>' + esc(c.name) + '</h3><p class="addr">' + esc(c.address) + "</p>" +
        '<p class="when">' + esc(when) + '</p><div class="links">' +
        '<a class="btn btn-primary" href="#book" data-chamber="' + c.id + '">Book here</a>' +
        '<a class="btn btn-ghost" href="tel:' + c.phones[0].replace(/\s/g, "") + '">Call</a>' +
        '<a class="btn btn-ghost" href="' + c.map + '" target="_blank" rel="noopener">Map</a></div></article>';
    }).join("");
    [].forEach.call(list.querySelectorAll(".reveal"), observe);
    list.addEventListener("click", function (e) {
      var id = e.target.getAttribute && e.target.getAttribute("data-chamber");
      if (id) selectChamber(id);
    });
  }

  /* ---------- booking ---------- */
  var form = $("#bookingForm");
  var chosen = { chamber: null, date: null, time: null };
  var cPick = $("#chamberPick"), dPick = $("#datePick");

  function radioKeys(group) {
    group.addEventListener("keydown", function (e) {
      var items = [].slice.call(group.querySelectorAll(".pick"));
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!n) return;
      e.preventDefault();
      var t = items[(i + n + items.length) % items.length];
      t.focus(); t.click();
    });
  }
  function upcoming(c) {
    var out = [], now = new Date();
    for (var k = 0; k < S.booking.daysAhead; k++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
      c.sessions.forEach(function (s) {
        if (s.day !== d.getDay()) return;
        var hm = s.time.split(":");
        var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +hm[0], +hm[1]);
        if (start - now > 30 * 60 * 1000) out.push({ date: start, time: s.time }); // stop booking 30 min before the session
      });
    }
    return out;
  }
  function selectChamber(id) {
    var c = S.chambers.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    chosen.chamber = c; chosen.date = null;
    [].forEach.call(cPick.children, function (b) {
      var on = b.dataset.id === id;
      b.setAttribute("aria-checked", on); b.tabIndex = on ? 0 : -1;
    });
    var dates = upcoming(c);
    dPick.innerHTML = dates.map(function (x, i) {
      return '<button type="button" class="pick" role="radio" aria-checked="false" tabindex="' + (i ? -1 : 0) + '" data-i="' + i + '">' +
        "<small>" + DAYS[x.date.getDay()].slice(0, 3) + "</small><b>" + x.date.getDate() + "</b><small>" +
        x.date.toLocaleString("en-IN", { month: "short" }) + " · " + fmtTime(x.time) + "</small></button>";
    }).join("");
    dPick._dates = dates;
    $("#dateHint").textContent = dates.length ? "Sessions at " + c.name + " over the next " + S.booking.daysAhead + " days." : "No upcoming sessions — please call the chamber.";
  }
  if (form) {
    cPick.innerHTML = S.chambers.map(function (c, i) {
      var days = c.sessions.map(function (s) { return DAYS[s.day].slice(0, 3); }).join(" · ");
      return '<button type="button" class="pick" role="radio" aria-checked="false" tabindex="' + (i ? -1 : 0) + '" data-id="' + c.id + '">' +
        esc(c.name) + "<small>" + days + "</small></button>";
    }).join("");
    radioKeys(cPick); radioKeys(dPick);
    cPick.addEventListener("click", function (e) {
      var b = e.target.closest(".pick"); if (b) selectChamber(b.dataset.id);
    });
    dPick.addEventListener("click", function (e) {
      var b = e.target.closest(".pick"); if (!b) return;
      var x = dPick._dates[+b.dataset.i];
      chosen.date = x.date; chosen.time = x.time;
      [].forEach.call(dPick.children, function (o) { var on = o === b; o.setAttribute("aria-checked", on); o.tabIndex = on ? 0 : -1; });
    });
    var pre = store("rr_last_chamber");
    if (pre) selectChamber(pre);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, err = $("#formError");
      [].forEach.call(form.querySelectorAll("[aria-invalid]"), function (x) { x.removeAttribute("aria-invalid"); });
      var problem = null;
      if (!chosen.chamber) problem = ["Please choose a chamber.", cPick.firstChild];
      else if (!chosen.date) problem = ["Please choose a date.", dPick.firstChild || cPick.firstChild];
      else {
        ["name", "age", "gender", "phone"].some(function (n) {
          if (!f[n].checkValidity() || !f[n].value.trim()) { problem = ["Please fill in " + (n === "phone" ? "a valid mobile number" : "the patient's " + n) + ".", f[n]]; f[n].setAttribute("aria-invalid", "true"); return true; }
        });
        var digits = f.phone.value.replace(/\D/g, "");
        if (!problem && (digits.length < 10 || digits.length > 12)) { problem = ["Please enter a valid 10-digit mobile number.", f.phone]; f.phone.setAttribute("aria-invalid", "true"); }
        if (!problem && !f.consent.checked) problem = ["Please tick the consent box so the clinic can contact you.", f.consent];
      }
      if (problem) { err.textContent = problem[0]; if (problem[1]) problem[1].focus(); return; }
      err.textContent = "";

      var c = chosen.chamber;
      var when = chosen.date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      var booking = {
        chamber: c.name, address: c.address, date: chosen.date.toISOString().slice(0, 10), when: when + ", " + fmtTime(chosen.time),
        name: f.name.value.trim(), age: f.age.value, gender: f.gender.value, phone: f.phone.value.trim(),
        visit: f.visit.value, reason: f.reason.value.trim(), createdAt: new Date().toISOString()
      };
      var msg = "*Appointment request — Dr. Ritam Roy*\n" +
        "Chamber: " + booking.chamber + "\n" + "Date: " + booking.when + "\n" +
        "Patient: " + booking.name + " (" + booking.age + ", " + booking.gender + ")\n" +
        "Mobile: " + booking.phone + "\n" + "Visit: " + booking.visit +
        (booking.reason ? "\nReason: " + booking.reason : "") + "\n\nPlease confirm my serial number. Thank you.";

      if (S.booking.endpoint) {
        try {
          fetch(S.booking.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(booking), keepalive: true }).catch(function () {});
        } catch (x) { /* WhatsApp path still works */ }
      }
      var mine = (store("rr_bookings") || []).filter(function (b) { return b.date >= new Date().toISOString().slice(0, 10); });
      mine.unshift(booking); store("rr_bookings", mine.slice(0, 5)); store("rr_last_chamber", c.id);
      renderMine();

      var link = wa(msg);
      var box = $("#confirm");
      box.hidden = false;
      box.innerHTML = "<h3>Almost done, " + esc(booking.name.split(" ")[0]) + "!</h3><p>Your request for <strong>" + esc(booking.when) +
        "</strong> at <strong>" + esc(c.name) + "</strong> is ready. Send it on WhatsApp and the clinic will reply with your serial number.</p>" +
        '<div class="hero-actions" style="margin:0"><a class="btn btn-primary" target="_blank" rel="noopener" href="' + link + '">Open WhatsApp</a>' +
        '<a class="btn btn-ghost" href="tel:' + c.phones[0].replace(/\s/g, "") + '">Or call ' + esc(c.phones[0]) + "</a></div>";
      box.focus();
      window.open(link, "_blank", "noopener");
    });
  }
  function renderMine() {
    var mine = (store("rr_bookings") || []).filter(function (b) { return b.date >= new Date().toISOString().slice(0, 10); });
    var wrap = $("#myBookings"); if (!wrap) return;
    wrap.hidden = !mine.length;
    $("#myBookingList").innerHTML = mine.map(function (b, i) {
      return "<li><span><strong>" + esc(b.name) + "</strong><br>" + esc(b.when) + " · " + esc(b.chamber) + '</span><button type="button" data-i="' + i + '" aria-label="Remove">Remove</button></li>';
    }).join("");
  }
  if ($("#myBookingList")) {
    $("#myBookingList").addEventListener("click", function (e) {
      if (!e.target.dataset.i) return;
      var mine = (store("rr_bookings") || []).filter(function (b) { return b.date >= new Date().toISOString().slice(0, 10); });
      mine.splice(+e.target.dataset.i, 1); store("rr_bookings", mine); renderMine();
    });
    renderMine();
  }

  /* ---------- latest blog notes ---------- */
  var latest = $("#latestPosts");
  if (latest) {
    fetch("blog/posts.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (data) {
      var posts = (data.posts || []).filter(function (p) { return !p.draft; })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
      if (!posts.length) { latest.innerHTML = '<p class="muted">The first note is coming soon.</p>'; return; }
      latest.innerHTML = posts.map(window.renderPostCard).join("");
      [].forEach.call(latest.querySelectorAll(".reveal"), observe);
    }).catch(function () {
      latest.innerHTML = '<p class="muted">Notes could not be loaded right now. <a href="blog.html">Open the blog</a>.</p>';
    });
  }
})();

/* Shared by index + blog pages. */
window.renderPostCard = function (p) {
  var e = function (s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var d = new Date(p.date + (p.date.length <= 10 ? "T08:00:00" : ""));
  var isNew = d.toDateString() === new Date().toDateString();
  var words = (p.body || "").split(/\s+/).length;
  var cover = p.cover ? '<img src="' + e(p.cover) + '" alt="" loading="lazy">' : '<span class="glyph">' + e((p.category || "Health").charAt(0)) + "</span>";
  return '<a class="post-card reveal" href="blog.html?p=' + encodeURIComponent(p.slug) + '"><div class="post-cover">' + cover + '</div><div class="post-body">' +
    '<div class="post-meta">' + (isNew ? '<span class="new-badge">New today</span>' : "") + '<span class="cat">' + e(p.category) + "</span><span>" +
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + "</span><span>" + Math.max(1, Math.round(words / 200)) + " min read</span></div>" +
    "<h3>" + e(p.title) + "</h3><p>" + e(p.summary) + "</p></div></a>";
};
