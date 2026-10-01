(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var slug = new URLSearchParams(location.search).get("p");
  var all = [], cat = "All";

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function reveal(root) { [].forEach.call(root.querySelectorAll(".reveal"), function (el) { el.classList.add("in"); }); }

  function renderList() {
    var q = $("#q").value.trim().toLowerCase();
    var shown = all.filter(function (p) {
      return (cat === "All" || p.category === cat) &&
        (!q || (p.title + " " + p.summary + " " + p.body).toLowerCase().indexOf(q) >= 0);
    });
    $("#postList").innerHTML = shown.length ? shown.map(window.renderPostCard).join("") : '<p class="muted">No notes match your search.</p>';
    reveal($("#postList"));
  }

  function renderArticle(p) {
    $("#listView").hidden = true;
    $("#articleView").hidden = false;
    document.title = p.title + " — Dr. Ritam Roy";
    var d = new Date(p.date + (p.date.length <= 10 ? "T08:00:00" : ""));
    $("#aMeta").innerHTML = '<span class="cat">' + esc(p.category) + "</span><span>" +
      d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</span>";
    $("#aTitle").textContent = p.title;
    $("#aSummary").textContent = p.summary || "";
    if (p.cover) $("#aCover").innerHTML = '<img src="' + esc(p.cover) + '" alt="">';
    else $("#aCover").hidden = true;
    $("#aBody").innerHTML = window.DOMPurify.sanitize(window.marked.parse(p.body || ""));
    var url = location.href;
    $("#aShare").innerHTML =
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(p.title + " — " + url) + '">Share on WhatsApp</a>' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '">Share on Facebook</a>' +
      '<button class="btn btn-ghost" type="button" id="copyLink">Copy link</button>';
    $("#copyLink").addEventListener("click", function (e) {
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { e.target.textContent = "Link copied ✓"; });
    });
  }

  fetch("blog/posts.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (data) {
    all = (data.posts || []).filter(function (p) { return !p.draft; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (slug) {
      var p = all.filter(function (x) { return x.slug === slug; })[0];
      if (p) return renderArticle(p);
    }
    var cats = ["All"].concat(all.map(function (p) { return p.category; }).filter(function (c, i, a) { return c && a.indexOf(c) === i; }));
    $("#filters").innerHTML = cats.map(function (c) {
      return '<button type="button" aria-pressed="' + (c === cat) + '">' + esc(c) + "</button>";
    }).join("");
    $("#filters").addEventListener("click", function (e) {
      if (e.target.tagName !== "BUTTON") return;
      cat = e.target.textContent;
      [].forEach.call(this.children, function (b) { b.setAttribute("aria-pressed", b === e.target); });
      renderList();
    });
    $("#q").addEventListener("input", renderList);
    renderList();
  }).catch(function () {
    $("#postList").innerHTML = '<p class="muted">Notes could not be loaded. Please try again later.</p>';
  });
})();
