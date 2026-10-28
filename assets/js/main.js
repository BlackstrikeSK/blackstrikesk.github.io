(function () {
  "use strict";
  function copyText(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = old; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () { copyText(btn.getAttribute("data-copy"), btn); });
  });

  document.querySelectorAll(".prose pre").forEach(function (pre) {
    var wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () { copyText(pre.innerText, btn); });
    wrap.appendChild(btn);
  });

  var toc = document.getElementById("toc");
  var heads = document.querySelectorAll(".post .prose h2[id], .post .prose h3[id]");
  if (toc && heads.length > 2) {
    var html = '<p>On this page</p><ol>';
    heads.forEach(function (h) {
      html += '<li><a href="#' + h.id + '"' + (h.tagName === "H3" ? ' class="sub"' : "") + ">" +
        h.textContent.replace(/</g, "&lt;") + "</a></li>";
    });
    toc.innerHTML = html + "</ol>";
    toc.hidden = false;

    var links = toc.querySelectorAll("a");
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (a) {
              a.removeAttribute("aria-current");
              if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
            });
          }
        });
      }, { rootMargin: "0px 0px -70% 0px" });
      heads.forEach(function (h) { obs.observe(h); });
    }
  }

  var chips = document.querySelectorAll(".chip");
  if (chips.length) {
    var rows = document.querySelectorAll(".rows li");
    var years = document.querySelectorAll(".year");
    var none = document.querySelector(".empty-filter");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var tag = chip.getAttribute("data-tag");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        rows.forEach(function (li) {
          var tags = (li.getAttribute("data-tags") || "").split(",");
          var match = !tag || tags.indexOf(tag) !== -1;
          li.hidden = !match;
          if (match) shown++;
        });
        years.forEach(function (y) {
          y.hidden = !y.querySelector("li:not([hidden])");
        });
        if (none) none.hidden = shown !== 0;
      });
    });
  }
})();
