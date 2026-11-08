(function () {
  const EMU = window.EMU;
  const FAV_KEY = "emu-favorites";

  const money = (n) => "ETB " + Number(n).toLocaleString("en-US");

  const waLink = (text) =>
    EMU.whatsapp + "?text=" + encodeURIComponent(text);

  function getFavs() {
    try {
      const list = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function setFavs(list) {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    paintHearts();
    const count = document.querySelector("[data-fav-count]");
    if (count) count.textContent = String(list.length);
  }

  function toast(message) {
    let node = document.querySelector(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      node.setAttribute("role", "status");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove("show"), 2800);
  }

  function productById(id) {
    return EMU.products.find((item) => item.id === id);
  }

  function heartButton(id) {
    const on = getFavs().includes(id);
    return (
      '<button class="heart' +
      (on ? " on" : "") +
      '" type="button" data-fav="' +
      id +
      '" aria-label="' +
      (on ? "Remove from saved pieces" : "Save this piece") +
      '" aria-pressed="' +
      (on ? "true" : "false") +
      '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.35-7-9.1A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.9C19 15.65 12 20 12 20z"/></svg></button>'
    );
  }

  function badges(product) {
    let html = "";
    if (product.popular) html += '<span class="badge">Popular</span>';
    if (product.custom) html += '<span class="badge badge-ink">Custom</span>';
    else if (product.inStock) html += '<span class="badge badge-soft">In stock</span>';
    else html += '<span class="badge badge-ink">Made to order</span>';
    return html;
  }

  function cardHTML(product) {
    const reserve = waLink(
      "Hello EMU Furniture, I would like to reserve the " +
        product.name +
        " (" +
        product.code +
        "). Guide price " +
        money(product.price) +
        ". Please confirm availability."
    );
    return (
      '<article class="card">' +
      '<div class="card-media">' +
      '<a href="product.html?id=' +
      product.id +
      '"><img src="' +
      product.image +
      '" alt="' +
      product.name +
      '"></a>' +
      heartButton(product.id) +
      '<div class="badges">' +
      badges(product) +
      "</div></div>" +
      '<div class="card-body">' +
      '<p class="code">' +
      product.code +
      " · " +
      product.category +
      "</p>" +
      "<h3><a href=\"product.html?id=" +
      product.id +
      '">' +
      product.name +
      "</a></h3>" +
      "<p>" +
      product.summary +
      "</p>" +
      '<div class="card-meta"><strong class="price">' +
      money(product.price) +
      '</strong><span>' +
      product.lead +
      "</span></div>" +
      '<div class="card-actions"><a class="btn btn-gold btn-sm" href="product.html?id=' +
      product.id +
      '">View piece</a><a class="btn btn-line btn-sm" href="' +
      reserve +
      '" target="_blank" rel="noopener">Reserve</a></div></div></article>'
    );
  }

  function paintHearts() {
    const favs = getFavs();
    document.querySelectorAll("[data-fav]").forEach((button) => {
      const on = favs.includes(button.dataset.fav);
      button.classList.toggle("on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.setAttribute("aria-label", on ? "Remove from saved pieces" : "Save this piece");
    });
    const count = document.querySelector("[data-fav-count]");
    if (count) count.textContent = String(favs.length);
  }

  function renderSignature() {
    const rail = document.querySelector("#signature");
    if (!rail) return;
    const picks = EMU.products.filter((item) => item.popular).slice(0, 8);
    rail.innerHTML = picks.map(cardHTML).join("");
    paintHearts();
  }

  function currentShopState() {
    const params = new URLSearchParams(location.search);
    return {
      cat: params.get("cat") || "all",
      q: params.get("q") || "",
      fav: params.get("fav") === "1",
      zone: params.get("zone") || "all",
      stock: params.get("stock") === "1",
      popular: params.get("popular") === "1",
      custom: params.get("custom") === "1",
      sort: params.get("sort") || "featured"
    };
  }

  function writeShopURL(state) {
    const params = new URLSearchParams();
    if (state.cat && state.cat !== "all") params.set("cat", state.cat);
    if (state.q) params.set("q", state.q);
    if (state.fav) params.set("fav", "1");
    if (state.zone && state.zone !== "all") params.set("zone", state.zone);
    if (state.stock) params.set("stock", "1");
    if (state.popular) params.set("popular", "1");
    if (state.custom) params.set("custom", "1");
    if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
    const next = params.toString();
    history.replaceState(null, "", next ? "shop.html?" + next : "shop.html");
  }

  function serves(product, zone) {
    if (!zone || zone === "all") return true;
    if (product.zones.includes("All Areas")) return true;
    return product.zones.includes(zone);
  }

  function renderShop() {
    const grid = document.querySelector("#catalog");
    if (!grid) return;
    const state = currentShopState();
    const catButtons = document.querySelectorAll("[data-cat]");
    catButtons.forEach((button) => {
      button.classList.toggle("on", button.dataset.cat === state.cat);
    });
    const search = document.querySelector("#shop-search");
    if (search && search.value !== state.q) search.value = state.q;
    const zone = document.querySelector("#shop-zone");
    if (zone) zone.value = state.zone;
    const sort = document.querySelector("#shop-sort");
    if (sort) sort.value = state.sort;
    document.querySelectorAll("[data-flag]").forEach((input) => {
      input.checked = Boolean(state[input.dataset.flag]);
    });
    const favToggle = document.querySelector("[data-fav-filter]");
    if (favToggle) favToggle.classList.toggle("on", state.fav);

    let items = EMU.products.slice();
    if (state.cat !== "all") {
      items = items.filter((item) => item.cat === state.cat || (state.cat === "custom" && item.custom));
    }
    if (state.q) {
      const q = state.q.toLowerCase();
      items = items.filter((item) =>
        (item.name + " " + item.code + " " + item.material + " " + item.category).toLowerCase().includes(q)
      );
    }
    if (state.fav) {
      const favs = getFavs();
      items = items.filter((item) => favs.includes(item.id));
    }
    if (state.stock) items = items.filter((item) => item.inStock);
    if (state.popular) items = items.filter((item) => item.popular);
    if (state.custom) items = items.filter((item) => item.custom);
    items = items.filter((item) => serves(item, state.zone));

    if (state.sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (state.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === "featured") items.sort((a, b) => Number(b.popular) - Number(a.popular));

    const count = document.querySelector("#result-count");
    if (count) {
      count.textContent = items.length + (items.length === 1 ? " piece" : " pieces");
    }

    if (!items.length) {
      grid.innerHTML =
        '<div class="empty"><h3>Nothing matches that yet.</h3><p>Clear a filter, or send the workshop a note and we will say if it can be made.</p><a class="btn btn-gold" href="custom.html">Ask for a custom piece</a></div>';
      return;
    }
    grid.innerHTML = items.map(cardHTML).join("");
    paintHearts();
  }

  function bindShop() {
    if (!document.querySelector("#catalog")) return;
    const read = () => currentShopState();

    document.querySelectorAll("[data-cat]").forEach((button) => {
      button.addEventListener("click", () => {
        const state = read();
        state.cat = button.dataset.cat;
        writeShopURL(state);
        renderShop();
      });
    });

    const search = document.querySelector("#shop-search");
    if (search) {
      search.addEventListener("input", () => {
        const state = read();
        state.q = search.value.trim();
        writeShopURL(state);
        renderShop();
      });
    }

    ["#shop-zone", "#shop-sort"].forEach((selector) => {
      const node = document.querySelector(selector);
      if (!node) return;
      node.addEventListener("change", () => {
        const state = read();
        if (selector === "#shop-zone") state.zone = node.value;
        if (selector === "#shop-sort") state.sort = node.value;
        writeShopURL(state);
        renderShop();
      });
    });

    document.querySelectorAll("[data-flag]").forEach((input) => {
      input.addEventListener("change", () => {
        const state = read();
        state[input.dataset.flag] = input.checked;
        writeShopURL(state);
        renderShop();
      });
    });

    const favToggle = document.querySelector("[data-fav-filter]");
    if (favToggle) {
      favToggle.addEventListener("click", () => {
        const state = read();
        state.fav = !state.fav;
        writeShopURL(state);
        renderShop();
      });
    }

    const clear = document.querySelector("#clear-filters");
    if (clear) {
      clear.addEventListener("click", () => {
        history.replaceState(null, "", "shop.html");
        const searchBox = document.querySelector("#shop-search");
        if (searchBox) searchBox.value = "";
        renderShop();
      });
    }

    renderShop();
    const filters = document.querySelector(".filters");
    if (filters && window.matchMedia("(max-width: 980px)").matches) filters.open = false;
  }

  function renderProduct() {
    const root = document.querySelector("#product-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const product = productById(id);
    if (!product) {
      root.innerHTML =
        '<div class="empty"><h2>That piece is not on the floor.</h2><p>It may have been renamed. The collection is still open.</p><a class="btn btn-gold" href="shop.html">Back to the collection</a></div>';
      return;
    }
    document.title = product.name + " | EMU Furniture";
    const reserve = waLink(
      "Hello EMU Furniture, I would like to reserve the " +
        product.name +
        " (" +
        product.code +
        ").\nGuide price: " +
        money(product.price) +
        "\nLead time: " +
        product.lead +
        "\nPlease confirm fabric, size, and delivery."
    );
    const thumbs = product.gallery
      .map(
        (src, index) =>
          '<button type="button" class="thumb' +
          (index === 0 ? " on" : "") +
          '" aria-label="Photo ' +
          (index + 1) +
          '" data-src="' +
          src +
          '"><img src="' +
          src +
          '" alt=""></button>'
      )
      .join("");
    const facts = product.details.map((line) => "<li>" + line + "</li>").join("");
    const zones = product.zones.includes("All Areas")
      ? "Hawassa and beyond, by arrangement"
      : product.zones.join(", ");
    const related = EMU.products.filter((item) => item.cat === product.cat && item.id !== product.id).slice(0, 3);

    root.innerHTML =
      '<p class="crumb"><a href="index.html">Home</a> / <a href="shop.html">Collection</a> / <a href="shop.html?cat=' +
      product.cat +
      '">' +
      product.category +
      "</a></p>" +
      '<div class="product">' +
      '<div class="gallery"><div class="gallery-main"><img id="gallery-main" src="' +
      product.image +
      '" alt="' +
      product.name +
      '"></div><div class="thumbs">' +
      thumbs +
      "</div></div>" +
      '<div class="buybox"><p class="code">' +
      product.code +
      "</p>" +
      "<h1>" +
      product.name +
      "</h1>" +
      '<p class="amharic gold">ለላቀ ጥራት ወሰን የለንም</p>' +
      '<p class="price-lg">' +
      money(product.price) +
      '</p><p class="fine">Showroom guide price. The final figure depends on size, cloth, and timber.</p>' +
      "<p>" +
      product.story +
      "</p>" +
      "<ul class=\"facts\">" +
      facts +
      "</ul>" +
      '<dl class="spec"><div><dt>Material</dt><dd>' +
      product.material +
      "</dd></div><div><dt>Lead time</dt><dd>" +
      product.lead +
      "</dd></div><div><dt>Delivery</dt><dd>" +
      zones +
      "</dd></div></dl>" +
      '<div class="card-actions"><a class="btn btn-gold" href="' +
      reserve +
      '" target="_blank" rel="noopener">Reserve on WhatsApp</a>' +
      heartButton(product.id).replace("heart", "heart heart-lg") +
      '<a class="btn btn-line" href="showroom.html">See it in Atote</a></div>' +
      '<p class="fine">Free delivery and assembly in Hawassa on orders over ETB 10,000. A video tour is available on WhatsApp if you cannot visit.</p></div></div>' +
      (related.length
        ? '<div class="section-head"><div><p class="eyebrow">Alongside it</p><h2>From the same room.</h2></div></div><div class="grid">' +
          related.map(cardHTML).join("") +
          "</div>"
        : "");
    paintHearts();

    root.querySelectorAll(".thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const image = document.querySelector("#gallery-main");
        if (image) image.src = thumb.dataset.src;
        root.querySelectorAll(".thumb").forEach((node) => node.classList.remove("on"));
        thumb.classList.add("on");
      });
    });
  }

  function bindRooms() {
    const buttons = document.querySelectorAll("[data-room]");
    const image = document.querySelector("#room-image");
    const text = document.querySelector("#room-text");
    const link = document.querySelector("#room-link");
    if (!buttons.length || !image) return;
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((node) => node.classList.remove("on"));
        button.classList.add("on");
        image.src = button.dataset.image;
        image.alt = button.dataset.label;
        const title = document.querySelector("#room-title");
        if (title) title.textContent = button.dataset.label;
        if (text) text.textContent = button.dataset.text;
        if (link) link.href = button.dataset.href;
      });
    });
  }

  function bindRails() {
    document.querySelectorAll("[data-rail-btn]").forEach((button) => {
      button.addEventListener("click", () => {
        const rail = document.querySelector(button.dataset.railBtn);
        if (!rail) return;
        rail.scrollBy({ left: Number(button.dataset.dir) * 320, behavior: "smooth" });
      });
    });
    document.querySelectorAll("[data-drag]").forEach((rail) => {
      let active = false;
      let startX = 0;
      let startLeft = 0;
      rail.addEventListener("pointerdown", (event) => {
        if (event.target.closest("a, button")) return;
        active = true;
        startX = event.clientX;
        startLeft = rail.scrollLeft;
        rail.classList.add("dragging");
      });
      rail.addEventListener("pointermove", (event) => {
        if (!active) return;
        rail.scrollLeft = startLeft - (event.clientX - startX);
      });
      const end = () => {
        active = false;
        rail.classList.remove("dragging");
      };
      rail.addEventListener("pointerup", end);
      rail.addEventListener("pointercancel", end);
    });
  }

  function bindForms() {
    document.querySelectorAll("form[data-whatsapp]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const lines = [form.dataset.intro || "Hello EMU Furniture,"];
        const data = new FormData(form);
        data.forEach((value, key) => {
          const clean = String(value).trim();
          if (clean) lines.push(key + ": " + clean);
        });
        window.open(waLink(lines.join("\n")), "_blank", "noopener");
        toast("WhatsApp is opening with your note.");
        form.reset();
      });
    });
  }

  function bindFaq() {
    document.querySelectorAll(".faq-q").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        const open = item.classList.toggle("open");
        button.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function bindNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector("#nav-toggle");
    const progress = document.querySelector("#progress");
    const onScroll = () => {
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
      if (progress) {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (height > 0 ? window.scrollY / height : 0) + ")";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      document.querySelectorAll(".nav a").forEach((link) => {
        link.addEventListener("click", () => {
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav a").forEach((link) => {
      const href = (link.getAttribute("href") || "").split("?")[0];
      if (href === page || (page === "" && href === "index.html")) link.classList.add("is-active");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.body.classList.remove("nav-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function bindReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );
    nodes.forEach((node) => observer.observe(node));
  }

  function bindCounters() {
    const nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;
    const run = (node) => {
      const target = Number(node.dataset.count);
      const suffix = node.dataset.suffix || "";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        node.textContent = target + suffix;
        return;
      }
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / 900);
        node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    nodes.forEach((node) => observer.observe(node));
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindFilms() {
    const vids = Array.from(document.querySelectorAll(".bgvid"));
    if (!vids.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cue = (video) => {
      const start = Number(video.dataset.start || 0);
      const go = () => {
        if (start) video.currentTime = start;
        video.play().catch(() => {});
      };
      if (video.readyState >= 1) go();
      else video.addEventListener("loadedmetadata", go, { once: true });
    };
    vids.forEach((video) => {
      video.muted = true;
      video.defaultMuted = true;
      const start = Number(video.dataset.start || 0);
      const end = Number(video.dataset.end || 0);
      video.addEventListener("timeupdate", () => {
        if (!video.classList.contains("on")) return;
        if (end && video.currentTime >= end) video.currentTime = start;
      });
      video.addEventListener("ended", () => cue(video));
    });
    if (reduced) {
      vids.forEach((video) => video.pause());
      return;
    }
    const first = vids.find((video) => video.classList.contains("on")) || vids[0];
    cue(first);
    if (vids.length < 2) return;
    let index = vids.indexOf(first);
    window.setInterval(() => {
      vids[index].classList.remove("on");
      vids[index].pause();
      index = (index + 1) % vids.length;
      const next = vids[index];
      next.classList.add("on");
      cue(next);
    }, 9000);
  }

  function reelCard(reel) {
    const tiktok = "https://www.tiktok.com/@emufurniture0/video/" + reel.id;
    const piece = reel.product
      ? '<a class="text-link" href="product.html?id=' + encodeURIComponent(reel.product) + '">See the piece</a>'
      : "";
    return (
      '<article class="reel" id="' + esc(reel.id) + '">' +
      '<video controls playsinline preload="none" poster="' + esc(reel.poster) + '" src="' + esc(reel.file) + '"></video>' +
      '<div class="reel-copy"><p class="eyebrow">' + esc(reel.views) + " views on TikTok</p><h3>" + esc(reel.title) + "</h3><p>" +
      esc(reel.caption) + '</p><div class="cluster">' + piece +
      '<a class="text-link" href="' + tiktok + '" target="_blank" rel="noopener">On TikTok</a></div></div></article>'
    );
  }

  function renderReels() {
    if (!window.EMU || !EMU.reels) return;
    const grid = document.querySelector("#reel-grid");
    const row = document.querySelector("#home-reels");
    if (grid) {
      grid.innerHTML = EMU.reels.map(reelCard).join("");
      grid.querySelectorAll("video").forEach((video) => {
        video.addEventListener("play", () => {
          grid.querySelectorAll("video").forEach((other) => {
            if (other !== video) other.pause();
          });
        });
      });
    }
    if (row) {
      row.innerHTML = EMU.reels.slice(0, 6).map((reel) =>
        '<a class="reel-poster" href="reels.html#' + encodeURIComponent(reel.id) + '">' +
        '<img src="' + esc(reel.poster) + '" alt="' + esc(reel.title) + '">' +
        "<span>" + esc(reel.title) + "</span></a>"
      ).join("");
    }
  }

  function bindSlides() {
    const slides = Array.from(document.querySelectorAll(".slide"));
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let index = 0;
    setInterval(() => {
      slides[index].classList.remove("on");
      index = (index + 1) % slides.length;
      slides[index].classList.add("on");
    }, 5600);
  }

  function hideLoader() {
    const loader = document.querySelector("#loader");
    if (!loader) return;
    const finish = () => {
      loader.classList.add("hide");
      sessionStorage.setItem("emu-in", "1");
    };
    if (document.documentElement.classList.contains("seen")) {
      loader.remove();
      return;
    }
    window.setTimeout(finish, 700);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fav]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const id = button.dataset.fav;
    const favs = getFavs();
    const has = favs.includes(id);
    const next = has ? favs.filter((item) => item !== id) : favs.concat(id);
    setFavs(next);
    const product = productById(id);
    toast(has ? "Removed from saved pieces." : (product ? product.name + " saved on this phone." : "Saved."));
    if (document.querySelector("#catalog") && new URLSearchParams(location.search).get("fav") === "1") {
      renderShop();
    }
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  bindNav();
  bindReveal();
  bindCounters();
  bindFilms();
  bindSlides();
  renderReels();
  bindRails();
  bindRooms();
  bindForms();
  bindFaq();
  renderSignature();
  bindShop();
  renderProduct();
  paintHearts();
  hideLoader();
})();
