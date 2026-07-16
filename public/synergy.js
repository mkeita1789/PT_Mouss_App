/* ═══════════════════════════════════════════════
   PT MOUSS IA — Modules inspirés de Synergy
   Roadmap calendrier · Fil d'activités · Semaine · Photos
   RÈGLE : aucun % de masse grasse, aucune pesée quotidienne imposée,
   aucun compteur de calories. On reprend le beau, pas le risqué.
   (dépend de app.js : S, store, weekNum, cycleFor, buildProgram, loadGains, badges, sessionsThisWeek, t, tf, LANG)
   ═══════════════════════════════════════════════ */

/* ═══ BOUTON SMS COACH ═══
   👉 REMPLACE le numéro ci-dessous par TON numéro, format international sans espaces.
      France : "+33612345678"  ·  Suède : "+46701234567" */
const COACH_PHONE = "+33XXXXXXXXX";
window.smsCoach = function () {
  const prenom = S.profile?.prenom || "";
  const body = encodeURIComponent(tf("sms.prefill", prenom));
  const num = COACH_PHONE.replace(/[^+0-9]/g, "");
  const sep = /iphone|ipad|ipod/i.test(navigator.userAgent) ? "&" : "?";
  window.location.href = "sms:" + num + sep + "body=" + body;
};
window.smsButton = function (compact) {
  return `<button class="btn ${compact ? "s" : "p"}" onclick="smsCoach()">${t("sms.coach")}</button>`;
};

/* ═══ 1. ROADMAP CALENDRIER ═══ */
function phaseColor(i) {
  const cols = ["#F2B233", "#8B7CF6", "#4ED07A", "#4AA3FF", "#E5484D", "#F2B233"];
  return cols[i % cols.length];
}
window.roadmapCalendar = function () {
  const cyc = cycleFor(S.profile);
  if (!cyc || !S.profile?.start) return "";
  const start = new Date(S.profile.start);
  const now = new Date();
  const months = LANG === "en"
    ? t("month.full").split(",")
    : t("month.full").split(",");
  const dayLabels = LANG === "en" ? ["M","T","W","T","F","S","S"] : ["L","M","M","J","V","S","D"];

  /* Quelle phase pour une date donnée ? */
  const phaseAt = (date) => {
    const w = Math.floor((date - start) / (7 * 864e5));
    if (w < 0) return null;
    return w % cyc.length;
  };

  /* Génère un mois (celui de la date courante) */
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1);
  const startDay = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayD = now.getDate();

  let cells = "";
  for (let i = 0; i < startDay; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const ph = phaseAt(date);
    const isToday = d === todayD;
    const col = ph !== null ? phaseColor(ph) : "transparent";
    cells += `<div class="cal-cell ${isToday ? "today" : ""}">
      <span>${d}</span>
      ${ph !== null ? `<div class="cal-dot" style="background:${col}"></div>` : ""}
    </div>`;
  }

  /* Légende : les phases du cycle avec leur couleur */
  const legend = cyc.map((c, i) => `<div class="cal-leg">
    <span class="cal-legdot" style="background:${phaseColor(i)}"></span>${c.n}</div>`).join("");

  return `<div class="card anim-item">
    <div class="eyebrow" style="margin-top:0">${t("sy.roadmap")}</div>
    <div style="text-align:center;font-family:Oswald;font-weight:600;font-size:16px;text-transform:uppercase;margin-bottom:12px">
      ${months[m]} ${y}</div>
    <div class="cal-grid cal-head">${dayLabels.map(l => `<div>${l}</div>`).join("")}</div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-legend">${legend}</div>
  </div>`;
};

/* ═══ 2. FIL D'ACTIVITÉS ═══ */
window.activityFeed = function () {
  const acts = [];
  const now = Date.now();
  const ago = (ts) => {
    const diff = now - ts;
    if (diff < 36e5) return t("act.ago.now");
    if (diff < 864e5) return tf("act.ago.h", Math.floor(diff / 36e5));
    return tf("act.ago.d", Math.floor(diff / 864e5));
  };

  /* Séances terminées (historique) */
  S.history.slice(-8).reverse().forEach(h => {
    if (h.iso) acts.push({ ts: new Date(h.iso).getTime(), ico: "🏋️", col: "var(--ok)", txt: tf("act.session", h.day) });
  });

  /* Records de charge (dernière valeur = max sur un exercice) */
  const gains = loadGains();
  Object.entries(gains).forEach(([n, g]) => {
    if (g.d > 0 && g.pts.length >= 2) {
      const max = Math.max(...g.pts);
      if (g.pts[g.pts.length - 1] === max) {
        const last = [...S.history].reverse().find(h => h.ex.some(e => e.n === n && parseFloat(String(e.load).replace(",", ".")) === max));
        if (last?.iso) acts.push({ ts: new Date(last.iso).getTime(), ico: "🏆", col: "var(--gold)", txt: tf("act.pr", n, String(max).replace(".", ",")) });
      }
    }
  });

  /* Objectif de pas atteint aujourd'hui */
  const d = S.daily[new Date().toISOString().slice(0, 10)];
  const neatGoal = S.profile?.objectif === "Perdre du gras" ? 10000 : 8000;
  if (d && (d.steps || 0) >= neatGoal)
    acts.push({ ts: now - 2 * 36e5, ico: "🚶", col: "var(--blue)", txt: tf("act.steps", neatGoal.toLocaleString(LANG === "en" ? "en-US" : "fr-FR")) });

  /* Dernier badge débloqué */
  const gotBadges = badges().filter(b => b.got);
  if (gotBadges.length) {
    const last = gotBadges[gotBadges.length - 1];
    acts.push({ ts: now - 3 * 36e5, ico: last.e, col: "var(--gold)", txt: tf("act.badge", last.t) });
  }

  if (!acts.length) return "";
  acts.sort((a, b) => b.ts - a.ts);

  return `<div class="card anim-item">
    <div class="eyebrow" style="margin-top:0">${t("sy.activity")}</div>
    ${acts.slice(0, 6).map(a => `<div class="act-row">
      <div class="act-ico" style="color:${a.col};border-color:${a.col}">${a.ico}</div>
      <div style="flex:1"><div style="font-size:13.5px;font-weight:500">${a.txt}</div>
        <div style="font-size:10.5px;color:var(--muted);margin-top:1px">${ago(a.ts)}</div></div>
    </div>`).join("")}
  </div>`;
};

/* ═══ 3. TABLEAU DE LA SEMAINE (sans calories imposées) ═══ */
window.weekTable = function () {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const dayKeys = ["wk.mon", "wk.tue", "wk.wed", "wk.thu", "wk.fri", "wk.sat", "wk.sun"];

  const cells = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday); day.setDate(monday.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    const trained = S.history.some(h => h.iso && h.iso.slice(0, 10) === iso);
    const dd = S.daily[iso];
    const isToday = day.toDateString() === now.toDateString();
    const isFuture = day > now;
    cells.push({ k: dayKeys[i], num: day.getDate(), trained, sleep: dd?.checkin?.sommeil, isToday, isFuture });
  }

  return `<div class="card anim-item">
    <div class="eyebrow" style="margin-top:0">${t("sy.week")}</div>
    <div class="wk-grid">
      ${cells.map(c => `<div class="wk-day ${c.isToday ? "today" : ""} ${c.isFuture ? "future" : ""}">
        <div class="wk-lb">${t(c.k)}</div>
        <div class="wk-num">${c.num}</div>
        <div class="wk-mark ${c.trained ? "on" : ""}">${c.trained ? "🔥" : c.isFuture ? "" : "·"}</div>
      </div>`).join("")}
    </div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-top:10px">
      ${sessionsThisWeek()}/${parseInt(S.profile?.freq) || 3} ${t("s.sets") === "sets" ? "sessions" : "séances"}</div>
  </div>`;
};

/* ═══ 4. PHOTOS DE PROGRESSION (version simple, stockées localement) ═══ */
window.photosBlock = function () {
  const photos = store.get("photos", []); // [{id, data(base64 réduit), date, label}]
  return `<div class="card anim-item">
    <div class="eyebrow" style="margin-top:0">${t("sy.photos")}</div>
    <div style="font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:12px">${t("sy.photo.hint")}</div>
    ${photos.length ? `<div class="photo-grid">
      ${photos.slice().reverse().map(p => `<div class="photo-item" onclick="viewPhoto('${p.id}')">
        <img src="${p.data}" alt="">
        <div class="photo-date">${p.date}</div>
      </div>`).join("")}
    </div>` : `<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:20px 10px">${t("sy.photo.empty")}</div>`}
    <input type="file" accept="image/*" id="photoInput" style="display:none" onchange="addPhoto(event)">
    <button class="btn s" style="margin-top:12px" onclick="document.getElementById('photoInput').click()">${t("sy.addphoto")}</button>
  </div>`;
};

window.addPhoto = function (ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    /* Réduire l'image (max 600px de large) pour ne pas saturer le localStorage */
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 600 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.7);
      const photos = store.get("photos", []);
      const now = new Date();
      const dateStr = now.toLocaleDateString(LANG === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "short" });
      photos.push({ id: "p" + Date.now(), data, date: dateStr, ts: now.getTime() });
      try {
        store.set("photos", photos);
      } catch (err) {
        alert(LANG === "en" ? "Storage full — delete an old photo first." : "Mémoire pleine — supprime une ancienne photo d'abord.");
        return;
      }
      if (navigator.vibrate) navigator.vibrate(40);
      render();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.viewPhoto = function (id) {
  const photos = store.get("photos", []);
  const p = photos.find(x => x.id === id);
  if (!p) return;
  const back = document.createElement("div");
  back.className = "modal-back";
  back.onclick = (ev) => { if (ev.target === back) back.remove(); };
  back.innerHTML = `<div class="modal" style="padding-top:16px">
    <button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button>
    <div class="modal-h">${p.date}</div>
    <img src="${p.data}" style="width:100%;border-radius:14px;margin:8px 0">
    <button class="btn s" style="border-color:rgba(229,72,77,.4);color:var(--ko)" onclick="delPhoto('${id}')">🗑️ ${LANG === "en" ? "Delete" : "Supprimer"}</button>
  </div>`;
  document.body.appendChild(back);
};
window.delPhoto = function (id) {
  if (!confirm(t("sy.photo.confirm"))) return;
  let photos = store.get("photos", []);
  photos = photos.filter(x => x.id !== id);
  store.set("photos", photos);
  document.querySelector(".modal-back")?.remove();
  render();
};

/* Premier rendu, une fois tous les modules chargés */
render();
