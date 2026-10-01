/* =====================================================
   JIRANI — app logic
   This prototype stores everything in the browser
   (localStorage) so it works without a server.
   Search for "BACKEND:" to find every place that
   should become an API call when you build the real thing.
   ===================================================== */

(() => {
  "use strict";

  /* ---------- tiny helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("jirani_" + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set(key, value) { localStorage.setItem("jirani_" + key, JSON.stringify(value)); },
    remove(key) { localStorage.removeItem("jirani_" + key); },
  };

  /* ---------- state ---------- */
  // BACKEND: runners, users and requests come from your database.
  let runners = store.get("runners", null) || structuredClone(RUNNERS_SEED);
  let users = store.get("users", []);
  let requests = store.get("requests", []);
  let session = store.get("session", null); // { email }
  let currency = store.get("currency", "KES");
  const filters = { county: "", service: "", sort: "rating", q: "" };

  const saveRunners = () => store.set("runners", runners);
  const saveUsers = () => store.set("users", users);
  const saveRequests = () => store.set("requests", requests);

  const currentUser = () => users.find((u) => u.email === session?.email) || null;
  const serviceById = (id) => SERVICES.find((s) => s.id === id);

  /* ---------- formatting ---------- */
  const COLORS = ["#0b5d35", "#b3261e", "#8a5a00", "#1b4a94", "#6b2d7a", "#14201a"];
  const colorFor = (str) => COLORS[[...str].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const avatar = (name, big = false) =>
    `<div class="avatar ${big ? "big" : ""}" style="background:${colorFor(name)}" aria-hidden="true">${esc(initials(name))}</div>`;

  function money(kes) {
    const kesText = `KES ${Number(kes).toLocaleString("en-KE")}`;
    if (currency === "KES") return `<strong>${kesText}</strong>`;
    const v = kes / CONFIG.currencies[currency];
    const num = v.toLocaleString("en", { maximumFractionDigits: v < 10 ? 2 : 0 });
    return `<strong>${currency} ${num}</strong><small>${kesText}</small>`;
  }

  const avgRating = (r) =>
    r.reviews.length ? r.reviews.reduce((a, b) => a + b.stars, 0) / r.reviews.length : 0;

  function starsHTML(r) {
    if (!r.reviews.length) return `<span class="stars"><small>New runner</small></span>`;
    const avg = avgRating(r);
    const full = Math.round(avg);
    return `<span class="stars" aria-label="${avg.toFixed(1)} out of 5">${"★".repeat(full)}${"☆".repeat(5 - full)}<small>${avg.toFixed(1)} (${r.reviews.length})</small></span>`;
  }

  const minRate = (r, serviceId) => {
    const list = serviceId ? r.services.filter((s) => s.id === serviceId) : r.services;
    return Math.min(...list.map((s) => s.rate));
  };

  /* ---------- toast & modal ---------- */
  function toast(msg) {
    const root = $("#toast-root");
    root.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`;
    setTimeout(() => (root.innerHTML = ""), 2800);
  }

  function openModal(html) {
    $("#modal-root").innerHTML = `
      <div class="modal-backdrop" data-action="close-modal-bg">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
          ${html}
        </div>
      </div>`;
    const first = $("#modal-root input, #modal-root select, #modal-root textarea");
    if (first) first.focus();
  }
  const closeModal = () => ($("#modal-root").innerHTML = "");

  /* ---------- views / routing ---------- */
  function showView(name) {
    if (!["browse", "join", "dashboard"].includes(name)) name = "browse";
    $$(".view").forEach((v) => (v.hidden = v.id !== "view-" + name));
    $$(".app-nav a").forEach((a) => a.classList.toggle("active", a.dataset.view === name));
    if (name === "browse") renderBrowse();
    if (name === "join") renderJoin();
    if (name === "dashboard") renderDashboard();
    window.scrollTo({ top: 0 });
  }
  const route = () => showView(location.hash.replace("#", "") || "browse");

  /* =====================================================
     HEADER: currency + auth area
     ===================================================== */
  function renderHeader() {
    $("#currency").innerHTML = Object.keys(CONFIG.currencies)
      .map((c) => `<option ${c === currency ? "selected" : ""}>${c}</option>`).join("");

    const u = currentUser();
    $("#auth-area").innerHTML = u
      ? `<span class="user-chip">Hi, ${esc(u.name.split(" ")[0])}</span>
         <button class="btn btn-ghost btn-small" data-action="logout">Log out</button>`
      : `<button class="btn btn-ghost btn-small" data-action="open-auth" data-mode="login">Log in</button>
         <button class="btn btn-primary btn-small" data-action="open-auth" data-mode="signup">Sign up</button>`;
  }

  /* =====================================================
     BROWSE
     ===================================================== */
  function setupFilters() {
    $("#f-county").innerHTML =
      `<option value="">All of Kenya</option>` + COUNTIES.map((c) => `<option>${esc(c)}</option>`).join("");
    $("#f-service").innerHTML =
      `<option value="">Any errand</option>` +
      SERVICES.map((s) => `<option value="${s.id}">${s.icon} ${esc(s.label)}</option>`).join("");

    // Allow the website to link here with ?county=Uasin%20Gishu&service=surprise
    const p = new URLSearchParams(location.search);
    if (p.get("county")) filters.county = p.get("county");
    if (p.get("service")) filters.service = p.get("service");
    $("#f-county").value = filters.county;
    $("#f-service").value = filters.service;

    $("#f-county").onchange = (e) => { filters.county = e.target.value; renderBrowse(); };
    $("#f-service").onchange = (e) => { filters.service = e.target.value; renderBrowse(); };
    $("#f-sort").onchange = (e) => { filters.sort = e.target.value; renderBrowse(); };
    $("#f-q").oninput = (e) => { filters.q = e.target.value.trim().toLowerCase(); renderBrowse(); };
  }

  function renderBrowse() {
    let list = runners.filter((r) => r.status === "verified");
    if (filters.county) list = list.filter((r) => r.county === filters.county);
    if (filters.service) list = list.filter((r) => r.services.some((s) => s.id === filters.service));
    if (filters.q) list = list.filter((r) => (r.name + " " + r.town + " " + r.county).toLowerCase().includes(filters.q));

    list.sort((a, b) => {
      if (filters.sort === "price") return minRate(a, filters.service) - minRate(b, filters.service);
      if (filters.sort === "reviews") return b.reviews.length - a.reviews.length;
      return avgRating(b) - avgRating(a) || b.reviews.length - a.reviews.length;
    });

    const where = filters.county ? ` in ${filters.county}` : " across Kenya";
    $("#result-count").textContent = `${list.length} verified ${list.length === 1 ? "runner" : "runners"}${where}`;

    $("#runner-grid").innerHTML = list.length
      ? list.map(cardHTML).join("")
      : `<div class="empty"><h3>No runners here yet</h3>
           <p>Try another county or errand type. Know someone reliable in ${esc(filters.county || "that area")}? Invite them to join.</p>
           <button class="btn btn-primary" data-action="go-join">Become a runner</button></div>`;
  }

  function cardHTML(r) {
    const chips = r.services.slice(0, 3).map((s) => `<span class="chip">${serviceById(s.id)?.icon || ""} ${esc(serviceById(s.id)?.label.split(" (")[0] || s.id)}</span>`).join("");
    const more = r.services.length > 3 ? `<span class="chip">+${r.services.length - 3} more</span>` : "";
    return `
      <button class="runner-card" data-action="open-runner" data-id="${esc(r.id)}">
        <div class="runner-top">
          ${avatar(r.name)}
          <div>
            <h3>${esc(r.name)}</h3>
            <div class="runner-loc">${esc(r.town)}, ${esc(r.county)}</div>
          </div>
        </div>
        <div><span class="badge-verified">✓ ID &amp; KRA verified</span></div>
        <div class="chip-row">${chips}${more}</div>
        <div class="runner-meta">
          ${starsHTML(r)}
          <div class="from-price"><small>from</small>${money(minRate(r, filters.service))}</div>
        </div>
      </button>`;
  }

  /* ---------- runner profile modal ---------- */
  function openRunner(id) {
    const r = runners.find((x) => x.id === id);
    if (!r) return;
    const rows = r.services.map((s) => {
      const svc = serviceById(s.id);
      return `<tr><td>${svc?.icon || ""} ${esc(svc?.label || s.id)}</td><td>${money(s.rate)}</td></tr>`;
    }).join("");
    const reviews = r.reviews.length
      ? r.reviews.map((v) => `
          <div class="review">
            <header><strong>${esc(v.by)}</strong><span class="stars">${"★".repeat(v.stars)}${"☆".repeat(5 - v.stars)}</span></header>
            <p>${esc(v.text)}</p>
          </div>`).join("")
      : `<p>No reviews yet. Be the first to book ${esc(r.name.split(" ")[0])}.</p>`;

    openModal(`
      <div class="profile-head">
        ${avatar(r.name, true)}
        <div>
          <h2>${esc(r.name)}</h2>
          <div class="runner-loc">${esc(r.town)}, ${esc(r.county)} County</div>
          <span class="badge-verified">✓ ID &amp; KRA verified</span>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat"><b>${starsHTML(r)}</b>Rating</div>
        <div class="stat"><b>${esc(r.idMasked)}</b>National ID</div>
        <div class="stat"><b>${esc(r.kraMasked)}</b>KRA PIN</div>
        <div class="stat"><b>${new Date(r.joined).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}</b>Joined</div>
      </div>

      <p>${esc(r.bio)}</p>

      <h3>Services &amp; starting rates</h3>
      <table class="rate-table"><tbody>${rows}</tbody></table>

      <h3>Reviews</h3>
      ${reviews}

      <div class="modal-actions">
        <button class="btn btn-primary" data-action="request" data-id="${esc(r.id)}">Request an errand</button>
        <button class="btn btn-ghost" data-action="review" data-id="${esc(r.id)}">Write a review</button>
      </div>`);
  }

  /* =====================================================
     AUTH
     ===================================================== */
  async function sha256(text) {
    // BACKEND: never hash in the browser for real. Send the password over HTTPS
    // and let your server hash it (bcrypt / argon2).
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  let afterAuth = null; // function to run once the user logs in

  function openAuth(mode = "login", message = "") {
    const signup = mode === "signup";
    openModal(`
      <h2>${signup ? "Create your account" : "Welcome back"}</h2>
      ${message ? `<p class="note">${esc(message)}</p>` : ""}
      <div class="auth-tabs">
        <button class="${!signup ? "on" : ""}" data-action="open-auth" data-mode="login">Log in</button>
        <button class="${signup ? "on" : ""}" data-action="open-auth" data-mode="signup">Sign up</button>
      </div>
      <div id="auth-error"></div>
      <form id="auth-form" novalidate>
        ${signup ? `
          <div class="field"><label for="a-name">Full name</label><input id="a-name" type="text" autocomplete="name" required /></div>
          <div class="field"><label for="a-country">Where do you live now?</label>
            <select id="a-country">${COUNTRIES_ABROAD.map((c) => `<option>${c}</option>`).join("")}<option>Kenya</option></select></div>` : ""}
        <div class="field"><label for="a-email">Email</label><input id="a-email" type="email" autocomplete="email" required /></div>
        <div class="field"><label for="a-pass">Password</label><input id="a-pass" type="password" autocomplete="${signup ? "new-password" : "current-password"}" required minlength="6" />
          ${signup ? "<small>At least 6 characters.</small>" : ""}</div>
        <button class="btn btn-primary btn-block" type="submit">${signup ? "Create account" : "Log in"}</button>
      </form>`);

    $("#auth-form").onsubmit = async (e) => {
      e.preventDefault();
      const email = $("#a-email").value.trim().toLowerCase();
      const pass = $("#a-pass").value;
      const showErr = (m) => ($("#auth-error").innerHTML = `<div class="form-error">${esc(m)}</div>`);
      if (!/^\S+@\S+\.\S+$/.test(email)) return showErr("Enter a valid email address.");
      if (pass.length < 6) return showErr("Password must be at least 6 characters.");
      const hash = await sha256(pass);

      if (signup) {
        const name = $("#a-name").value.trim();
        if (name.length < 3) return showErr("Enter your full name.");
        if (users.some((u) => u.email === email)) return showErr("That email already has an account. Try logging in.");
        users.push({ name, email, hash, country: $("#a-country").value, created: new Date().toISOString() });
        saveUsers();
      } else {
        const u = users.find((x) => x.email === email && x.hash === hash);
        if (!u) return showErr("Email or password is incorrect.");
      }
      session = { email };
      store.set("session", session);
      closeModal();
      renderHeader();
      toast(signup ? "Account created. Karibu!" : "Welcome back!");
      const next = afterAuth; afterAuth = null;
      if (next) next(); else route();
    };
  }

  function requireLogin(message, then) {
    if (currentUser()) return true;
    afterAuth = then;
    openAuth("signup", message);
    return false;
  }

  /* =====================================================
     REQUEST AN ERRAND
     ===================================================== */
  function openRequest(runnerId) {
    if (!requireLogin("Create a free account to request an errand.", () => openRequest(runnerId))) return;
    const r = runners.find((x) => x.id === runnerId);
    const opts = r.services.map((s) => `<option value="${s.id}">${serviceById(s.id)?.icon} ${esc(serviceById(s.id)?.label)}</option>`).join("");
    openModal(`
      <h2>Request an errand from ${esc(r.name)}</h2>
      <div id="req-error"></div>
      <form id="req-form" novalidate>
        <div class="field"><label for="q-service">What do you need?</label><select id="q-service">${opts}</select></div>
        <div class="field"><label for="q-details">Describe the errand</label>
          <textarea id="q-details" placeholder="e.g. Buy a 55-inch TV and deliver to my mother in Langas, Eldoret. Send a photo first."></textarea></div>
        <div class="two-col">
          <div class="field"><label for="q-budget">Your budget (KES)</label><input id="q-budget" type="number" min="0" step="100" /></div>
          <div class="field"><label for="q-date">Needed by</label><input id="q-date" type="date" /></div>
        </div>
        <div class="field"><label for="q-where">Delivery place / recipient</label><input id="q-where" type="text" placeholder="Name, estate or landmark, phone" /></div>
        <p class="note">Payment is arranged directly in this prototype. The full version holds your money safely (escrow via M-Pesa) until you confirm the job is done.</p>
        <button class="btn btn-primary btn-block" type="submit">Send request</button>
      </form>`);

    $("#req-form").onsubmit = (e) => {
      e.preventDefault();
      const details = $("#q-details").value.trim();
      if (details.length < 10) return ($("#req-error").innerHTML = `<div class="form-error">Add a few more details so ${esc(r.name.split(" ")[0])} knows what to do.</div>`);
      const u = currentUser();
      // BACKEND: POST /api/requests
      requests.push({
        id: "q" + Date.now(), runnerId: r.id, runnerName: r.name,
        clientEmail: u.email, clientName: u.name,
        service: $("#q-service").value, details,
        budget: Number($("#q-budget").value) || 0, needBy: $("#q-date").value,
        where: $("#q-where").value.trim(), status: "Sent", created: new Date().toISOString(),
      });
      saveRequests();
      closeModal();
      toast("Request sent to " + r.name.split(" ")[0]);
      location.hash = "#dashboard";
    };
  }

  /* =====================================================
     REVIEWS
     ===================================================== */
  function openReview(runnerId) {
    if (!requireLogin("Log in to leave a review.", () => openReview(runnerId))) return;
    const r = runners.find((x) => x.id === runnerId);
    if (r.ownerEmail && r.ownerEmail === currentUser().email) return toast("You can't review your own profile.");

    openModal(`
      <h2>Review ${esc(r.name)}</h2>
      <div id="rev-error"></div>
      <form id="rev-form" novalidate>
        <div class="field"><span class="field-label"><b>Your rating</b></span>
          <div class="star-pick" id="star-pick">
            ${[1, 2, 3, 4, 5].map((n) => `<label data-n="${n}"><input type="radio" name="stars" value="${n}" />★</label>`).join("")}
          </div></div>
        <div class="field"><label for="rv-text">What was it like?</label>
          <textarea id="rv-text" placeholder="Did they communicate? Were receipts honest? Was it on time?"></textarea></div>
        <button class="btn btn-primary btn-block" type="submit">Post review</button>
      </form>`);

    const pick = $("#star-pick");
    pick.onchange = () => {
      const n = Number($("input[name=stars]:checked", pick).value);
      $$("label", pick).forEach((l) => l.classList.toggle("lit", Number(l.dataset.n) <= n));
    };

    $("#rev-form").onsubmit = (e) => {
      e.preventDefault();
      const chosen = $("input[name=stars]:checked", pick);
      const text = $("#rv-text").value.trim();
      if (!chosen) return ($("#rev-error").innerHTML = `<div class="form-error">Choose a star rating.</div>`);
      if (text.length < 10) return ($("#rev-error").innerHTML = `<div class="form-error">Write at least a short sentence.</div>`);
      const u = currentUser();
      // BACKEND: POST /api/runners/:id/reviews  (only allow reviews after a completed job)
      r.reviews.unshift({
        by: `${u.name.split(" ")[0]} ${u.name.split(" ").slice(-1)[0][0]}., ${u.country}`,
        stars: Number(chosen.value), text, date: new Date().toISOString().slice(0, 10),
      });
      saveRunners();
      toast("Review posted. Asante!");
      openRunner(r.id);
      renderBrowse();
    };
  }

  /* =====================================================
     BECOME A RUNNER (verification form)
     ===================================================== */
  function renderJoin() {
    const panel = $("#join-panel");
    const u = currentUser();

    if (!u) {
      panel.innerHTML = `<div class="form-card gate">
        <h2>First, create an account</h2>
        <p>It takes a minute. Then you can submit your verification details.</p>
        <button class="btn btn-primary" data-action="open-auth" data-mode="signup">Sign up</button>
        <button class="btn btn-ghost" data-action="open-auth" data-mode="login">Log in</button></div>`;
      return;
    }

    const mine = runners.find((r) => r.ownerEmail === u.email);
    if (mine) {
      panel.innerHTML = `<div class="form-card">
        <h2>Your runner profile</h2>
        <p>${mine.status === "verified"
          ? `<span class="badge-verified">✓ Verified</span> Your profile is live.`
          : `<span class="badge-pending">Under review</span> We are checking your ID and KRA PIN. This usually takes 1 to 2 working days.`}</p>
        <button class="btn btn-primary" data-action="go-dashboard">Open dashboard</button></div>`;
      return;
    }

    panel.innerHTML = `
      <form class="form-card" id="join-form" novalidate>
        <h2>Verification details</h2>
        <div id="join-error"></div>

        <div class="field"><label for="j-name">Full name (as on your ID)</label>
          <input id="j-name" type="text" value="${esc(u.name)}" /></div>

        <div class="two-col">
          <div class="field"><label for="j-county">County</label>
            <select id="j-county">${COUNTIES.map((c) => `<option ${c === "Uasin Gishu" ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
          <div class="field"><label for="j-town">Town / area</label><input id="j-town" type="text" placeholder="e.g. Eldoret" /></div>
        </div>

        <div class="two-col">
          <div class="field"><label for="j-phone">Phone (M-Pesa)</label><input id="j-phone" type="tel" placeholder="0712 345 678" /></div>
          <div class="field"><label for="j-id">National ID number</label><input id="j-id" type="text" inputmode="numeric" placeholder="e.g. 12345678" /></div>
        </div>

        <div class="field"><label for="j-kra">KRA PIN</label><input id="j-kra" type="text" placeholder="A123456789Z" maxlength="11" />
          <small>11 characters: a letter, 9 digits, a letter.</small></div>

        <div class="two-col">
          <div class="field"><label for="j-idpic">National ID photo (front)</label>
            <div class="upload-box"><input id="j-idpic" type="file" accept="image/*" /><img id="prev-id" alt="" hidden /></div></div>
          <div class="field"><label for="j-selfie">Selfie holding your ID</label>
            <div class="upload-box"><input id="j-selfie" type="file" accept="image/*" /><img id="prev-selfie" alt="" hidden /></div></div>
        </div>

        <fieldset class="field" style="border:0;padding:0;margin:0 0 1rem">
          <legend>Errands you offer and your starting rate (KES)</legend>
          <div class="svc-pick">
            ${SERVICES.map((s) => `
              <div class="svc-row" data-svc="${s.id}">
                <label><input type="checkbox" value="${s.id}" /> ${s.icon} ${esc(s.label)}</label>
                <input type="number" min="100" step="100" placeholder="KES" disabled aria-label="Rate for ${esc(s.label)}" />
              </div>`).join("")}
          </div>
        </fieldset>

        <div class="field"><label for="j-bio">About you</label>
          <textarea id="j-bio" placeholder="Tell families abroad what you do, where you work and why they can trust you."></textarea></div>

        <label class="consent"><input type="checkbox" id="j-consent" />
          <span>I confirm these details are true and I agree to Jirani processing my documents for verification under the Data Protection Act, 2019.</span></label>

        <button class="btn btn-red btn-block" type="submit">Submit for verification</button>
      </form>`;

    // live image previews (shown locally only — files are NOT uploaded in this prototype)
    [["j-idpic", "prev-id"], ["j-selfie", "prev-selfie"]].forEach(([inputId, imgId]) => {
      $("#" + inputId).onchange = (e) => {
        const f = e.target.files[0];
        const img = $("#" + imgId);
        if (f) { img.src = URL.createObjectURL(f); img.hidden = false; }
      };
    });

    // enable the rate box when a service is ticked
    $$(".svc-row").forEach((row) => {
      const cb = $("input[type=checkbox]", row);
      const rate = $("input[type=number]", row);
      cb.onchange = () => { rate.disabled = !cb.checked; row.classList.toggle("on", cb.checked); if (cb.checked) rate.focus(); };
    });

    $("#join-form").onsubmit = (e) => { e.preventDefault(); submitRunner(u); };
  }

  function submitRunner(u) {
    const err = (m) => { $("#join-error").innerHTML = `<div class="form-error">${esc(m)}</div>`; $("#join-error").scrollIntoView({ behavior: "smooth", block: "center" }); };

    const name = $("#j-name").value.trim();
    const town = $("#j-town").value.trim();
    const phone = $("#j-phone").value.replace(/\s/g, "");
    const idNo = $("#j-id").value.trim();
    const kra = $("#j-kra").value.trim().toUpperCase();
    const bio = $("#j-bio").value.trim();

    if (name.length < 3) return err("Enter your full name as it appears on your ID.");
    if (town.length < 2) return err("Enter your town or area.");
    if (!/^(\+254|0)[17]\d{8}$/.test(phone)) return err("Enter a valid Kenyan phone number, e.g. 0712345678.");
    if (!/^\d{7,8}$/.test(idNo)) return err("National ID number should be 7 or 8 digits.");
    if (!/^[AP]\d{9}[A-Z]$/.test(kra)) return err("KRA PIN should look like A123456789Z.");
    if (!$("#j-idpic").files[0]) return err("Upload a photo of the front of your National ID.");
    if (!$("#j-selfie").files[0]) return err("Upload a selfie holding your National ID.");

    const services = $$(".svc-row").filter((r) => $("input[type=checkbox]", r).checked)
      .map((r) => ({ id: r.dataset.svc, rate: Number($("input[type=number]", r).value) }));
    if (!services.length) return err("Choose at least one errand you offer.");
    if (services.some((s) => !(s.rate >= 100))) return err("Enter a starting rate of at least KES 100 for each errand you picked.");
    if (bio.length < 30) return err("Write a short bio (at least 30 characters) so families can get to know you.");
    if (!$("#j-consent").checked) return err("Please confirm the declaration to continue.");

    // BACKEND: upload both images to private storage (e.g. S3 / Cloudinary with signed URLs),
    // send idNo + kra to your server, and check them (IPRS / KRA iTax) before approving.
    // NEVER store the full ID or KRA PIN in the browser or show it publicly.
    runners.push({
      id: "r" + Date.now(), ownerEmail: u.email, name, county: $("#j-county").value, town, phone,
      status: "pending", idMasked: "•••• " + idNo.slice(-4), kraMasked: kra[0] + "•••••••" + kra.slice(-2),
      joined: new Date().toISOString().slice(0, 10), bio, services, reviews: [],
      documents: { idPhoto: $("#j-idpic").files[0].name, selfie: $("#j-selfie").files[0].name },
    });
    saveRunners();
    toast("Submitted! We'll review your documents.");
    location.hash = "#dashboard";
  }

  /* =====================================================
     DASHBOARD
     ===================================================== */
  function reqHTML(q, as) {
    const svc = serviceById(q.service);
    const when = new Date(q.created).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
    let actions = "";
    if (as === "runner" && q.status === "Sent") actions = `<button class="btn btn-primary btn-small" data-action="req-status" data-id="${q.id}" data-to="Accepted">Accept</button>`;
    if (as === "runner" && q.status === "Accepted") actions = `<button class="btn btn-primary btn-small" data-action="req-status" data-id="${q.id}" data-to="Completed">Mark completed</button>`;
    if (as === "client" && q.status === "Completed") actions = `<button class="btn btn-ghost btn-small" data-action="review" data-id="${q.runnerId}">Leave a review</button>`;
    return `
      <div class="req">
        <header><span>${svc?.icon || ""} ${esc(svc?.label || q.service)}</span><span class="status ${q.status}">${q.status}</span></header>
        <p>${as === "client" ? "To " + esc(q.runnerName) : "From " + esc(q.clientName)} · ${when}${q.budget ? " · Budget KES " + q.budget.toLocaleString("en-KE") : ""}</p>
        <p>${esc(q.details)}</p>
        ${actions}
      </div>`;
  }

  function renderDashboard() {
    const panel = $("#dashboard-panel");
    const u = currentUser();
    if (!u) {
      panel.innerHTML = `<div class="gate"><h1>Your dashboard</h1>
        <p>Log in to see your requests and runner profile.</p>
        <button class="btn btn-primary" data-action="open-auth" data-mode="login">Log in</button>
        <button class="btn btn-ghost" data-action="open-auth" data-mode="signup">Sign up</button></div>`;
      return;
    }

    const mine = runners.find((r) => r.ownerEmail === u.email);
    const sent = requests.filter((q) => q.clientEmail === u.email);
    const incoming = mine ? requests.filter((q) => q.runnerId === mine.id) : [];

    const profilePanel = mine ? `
      <div class="panel">
        <h2>My runner profile</h2>
        <p>${mine.status === "verified" ? `<span class="badge-verified">✓ Verified</span>` : `<span class="badge-pending">Under review</span>`}</p>
        <p><strong>${esc(mine.name)}</strong><br>${esc(mine.town)}, ${esc(mine.county)}<br>ID ${esc(mine.idMasked)} · KRA ${esc(mine.kraMasked)}</p>
        ${mine.status === "pending" ? `
          <p class="note">In the real app a Jirani reviewer checks your documents. For this demo you can approve yourself to see how your profile looks to clients.</p>
          <button class="btn btn-ochre btn-small" data-action="approve-demo" data-id="${mine.id}">Approve (demo only)</button>` : `
          <button class="btn btn-ghost btn-small" data-action="open-runner" data-id="${mine.id}">View public profile</button>`}
      </div>` : `
      <div class="panel">
        <h2>Earn as a runner</h2>
        <p>Offer errands in your county and get paid by families abroad.</p>
        <button class="btn btn-primary btn-small" data-action="go-join">Become a runner</button>
      </div>`;

    panel.innerHTML = `
      <div class="dash">
        <h1>Habari, ${esc(u.name.split(" ")[0])}</h1>
        <div class="dash-grid">
          ${profilePanel}
          <div class="panel">
            <h2>Need something done back home?</h2>
            <p>Browse verified runners by county and send a request.</p>
            <button class="btn btn-primary btn-small" data-action="go-browse">Find a runner</button>
          </div>
          <div class="panel wide">
            <h2>Errands I requested</h2>
            ${sent.length ? sent.slice().reverse().map((q) => reqHTML(q, "client")).join("") : "<p>You haven't requested anything yet.</p>"}
          </div>
          ${mine ? `<div class="panel wide"><h2>Incoming requests</h2>
            ${incoming.length ? incoming.slice().reverse().map((q) => reqHTML(q, "runner")).join("") : "<p>No requests yet. Share your profile on TikTok and WhatsApp.</p>"}</div>` : ""}
        </div>
      </div>`;
  }

  /* =====================================================
     EVENTS (one listener for the whole page)
     ===================================================== */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const { action, id, mode, to } = el.dataset;

    if (action === "close-modal-bg") { if (e.target === el) closeModal(); return; }

    switch (action) {
      case "close-modal": closeModal(); break;
      case "open-runner": openRunner(id); break;
      case "request": openRequest(id); break;
      case "review": openReview(id); break;
      case "open-auth": openAuth(mode); break;
      case "logout":
        session = null; store.remove("session"); renderHeader(); toast("Logged out"); route(); break;
      case "go-join": closeModal(); location.hash = "#join"; break;
      case "go-browse": location.hash = "#browse"; break;
      case "go-dashboard": location.hash = "#dashboard"; break;
      case "approve-demo": {
        const r = runners.find((x) => x.id === id);
        if (r) { r.status = "verified"; saveRunners(); toast("Profile approved (demo)"); renderDashboard(); }
        break;
      }
      case "req-status": {
        const q = requests.find((x) => x.id === id);
        if (q) { q.status = to; saveRequests(); renderDashboard(); toast("Marked " + to.toLowerCase()); }
        break;
      }
    }
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  $("#currency").addEventListener("change", (e) => {
    currency = e.target.value;
    store.set("currency", currency);
    route();
  });

  window.addEventListener("hashchange", route);

  /* ---------- start ---------- */
  renderHeader();
  setupFilters();
  route();
})();
