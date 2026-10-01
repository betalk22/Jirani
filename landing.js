/* JIRANI — website script (index.html). Uses lists from data.js */

// County dropdown in the hero
document.getElementById("county").innerHTML =
  `<option value="">All of Kenya</option>` +
  COUNTIES.map((c) => `<option ${c === "Uasin Gishu" ? "selected" : ""}>${c}</option>`).join("");

// Service tiles link straight into the app, pre-filtered
document.getElementById("svc-grid").innerHTML = SERVICES.map(
  (s) => `<a class="svc-tile" href="app.html?service=${s.id}"><span>${s.icon}</span><span>${s.label}</span></a>`
).join("");

document.getElementById("year").textContent = new Date().getFullYear();
