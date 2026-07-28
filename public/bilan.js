/* ═══════════════════════════════════════════════
   JIGI — Bilan de fin de semaine
   L'app rédige le rapport, la cliente l'envoie en un geste.
   Aucun serveur : tout se passe par la messagerie du téléphone.
   ═══════════════════════════════════════════════ */

/* Lundi de la semaine contenant `d` */
function mondayOf(d) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  m.setHours(0, 0, 0, 0);
  return m;
}

/* ─── Collecte des données d'une semaine ─── */
window.semaineData = function (offset) {
  offset = offset || 0; /* 0 = semaine en cours, -1 = semaine passée */
  const lundi = mondayOf(new Date());
  lundi.setDate(lundi.getDate() + offset * 7);
  const dimanche = new Date(lundi); dimanche.setDate(lundi.getDate() + 7);

  const seances = S.history.filter(h => {
    if (!h.iso) return false;
    const d = new Date(h.iso);
    return d >= lundi && d < dimanche;
  });

  /* Check-ins de la semaine */
  const checkins = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lundi); d.setDate(lundi.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dd = S.daily[iso];
    if (dd?.checkin) checkins.push({ iso, ...dd.checkin, steps: dd.steps || 0, water: dd.water || 0 });
  }

  /* Progression par exercice sur la semaine */
  const exos = {};
  seances.forEach(h => h.ex.forEach(e => {
    const v = parseFloat(String(e.load).replace(",", "."));
    if (isNaN(v)) return;
    (exos[e.n] = exos[e.n] || []).push({ load: v, amrap: e.amrap, cible: e.cible });
  }));

  /* Signaux à remonter au coach */
  const douleurs = checkins.filter(c => c.corps === "🔴 Une douleur");
  const mauvaisSommeil = checkins.filter(c => c.sommeil === "😵 Mauvais (<6 h)").length;
  const notes = seances.flatMap(h => h.ex.filter(e => e.note).map(e => `${e.n} : ${e.note}`));

  const target = parseInt(S.profile?.freq) || 3;
  const ph = phaseFor(S.profile);

  return { lundi, dimanche, seances, checkins, exos, douleurs, mauvaisSommeil, notes, target, phase: ph };
};

/* ─── Rédaction du bilan (texte prêt à envoyer) ─── */
window.bilanTexte = function (offset) {
  const d = window.semaineData(offset);
  const EN = LANG === "en";
  const fmt = (n) => String(n).replace(".", ",");
  const dateStr = (x) => x.toLocaleDateString(EN ? "en-US" : "fr-FR", { day: "numeric", month: "short" });
  const fin = new Date(d.dimanche); fin.setDate(fin.getDate() - 1);
  const L = [];

  L.push(EN ? `📋 WEEKLY REPORT — ${S.profile?.prenom || ""}` : `📋 BILAN DE SEMAINE — ${S.profile?.prenom || ""}`);
  L.push(`${dateStr(d.lundi)} → ${dateStr(fin)}`);
  if (d.phase) L.push(EN ? `Phase: ${d.phase.n} (week ${d.phase.week}/${d.phase.len})` : `Phase : ${d.phase.n} (semaine ${d.phase.week}/${d.phase.len})`);
  L.push("");

  /* Assiduité */
  L.push(EN ? `🏋️ SESSIONS: ${d.seances.length}/${d.target}` : `🏋️ SÉANCES : ${d.seances.length}/${d.target}`);
  d.seances.forEach(h => L.push(`   • ${h.day} — ${h.focus}`));
  if (!d.seances.length) L.push(EN ? "   (none this week)" : "   (aucune cette semaine)");
  L.push("");

  /* Charges et AMRAP */
  const keys = Object.keys(d.exos);
  if (keys.length) {
    L.push(EN ? "💪 LOADS & LAST SET" : "💪 CHARGES & DERNIÈRE SÉRIE");
    keys.forEach(n => {
      const pts = d.exos[n];
      const first = pts[0], last = pts[pts.length - 1];
      const delta = last.load - first.load;
      let ligne = `   • ${n} : ${fmt(last.load)} kg`;
      if (delta !== 0) ligne += ` (${delta > 0 ? "+" : ""}${fmt(Math.round(delta * 10) / 10)})`;
      if (last.amrap) ligne += EN ? ` — ${last.amrap} reps` : ` — ${last.amrap} reps`;
      if (last.amrap && last.cible) {
        const ec = last.amrap - last.cible;
        ligne += ec > 0 ? ` (+${ec})` : ec < 0 ? ` (${ec})` : ` (=)`;
      }
      L.push(ligne);
    });
    L.push("");
  }

  /* Forme */
  if (d.checkins.length) {
    L.push(EN ? `😴 CHECK-INS: ${d.checkins.length}/7` : `😴 CHECK-INS : ${d.checkins.length}/7`);
    if (d.mauvaisSommeil) L.push(EN ? `   • Poor sleep: ${d.mauvaisSommeil} day(s)` : `   • Sommeil court : ${d.mauvaisSommeil} jour(s)`);
    const pasMoy = Math.round(d.checkins.reduce((a, c) => a + c.steps, 0) / d.checkins.length);
    if (pasMoy) L.push(EN ? `   • Avg steps: ${pasMoy.toLocaleString("en-US")}` : `   • Pas/jour : ${pasMoy.toLocaleString("fr-FR")}`);
    L.push("");
  }

  /* Poids — uniquement si le protocole l'autorise */
  if (window.peseeAutorisee && window.peseeAutorisee()) {
    const mes = (S.measures || []).filter(m => m.ts && m.poids);
    if (mes.length) {
      const dansSem = mes.filter(m => new Date(m.ts) >= d.lundi && new Date(m.ts) < d.dimanche);
      const dernier = dansSem[dansSem.length - 1] || mes[mes.length - 1];
      const precedent = mes[mes.indexOf(dernier) - 1];
      let ligne = EN ? `⚖️ WEIGHT: ${dernier.poids} kg` : `⚖️ POIDS : ${dernier.poids} kg`;
      if (precedent) {
        const dd = Math.round((parseFloat(String(dernier.poids).replace(",", ".")) - parseFloat(String(precedent.poids).replace(",", "."))) * 10) / 10;
        if (!isNaN(dd) && dd !== 0) ligne += ` (${dd > 0 ? "+" : ""}${fmt(dd)})`;
      }
      L.push(ligne);
      L.push("");
    }
  }

  /* Photo de la semaine */
  const photosSem = store.get("photos", []).filter(p => p.ts && new Date(p.ts) >= d.lundi && new Date(p.ts) < d.dimanche);
  if (photosSem.length) {
    L.push(EN ? `📸 PHOTO: taken (${photosSem.length})` : `📸 PHOTO : prise (${photosSem.length})`);
    L.push(EN ? "   → send it separately if you want my feedback" : "   → envoie-la à part si tu veux mon retour");
    L.push("");
  }

  /* ⚠️ Signaux — toujours en évidence */
  if (d.douleurs.length) {
    L.push(EN ? `🔴 PAIN REPORTED: ${d.douleurs.length} day(s)` : `🔴 DOULEUR SIGNALÉE : ${d.douleurs.length} jour(s)`);
    L.push(EN ? "   → to discuss" : "   → à en parler");
    L.push("");
  }

  /* Notes libres */
  if (d.notes.length) {
    L.push(EN ? "📝 NOTES" : "📝 NOTES");
    d.notes.slice(0, 6).forEach(n => L.push(`   • ${n}`));
    L.push("");
  }

  L.push(EN ? "— sent from PT Mouss IA" : "— envoyé depuis PT Mouss IA");
  return L.join("\n");
};

/* ─── Envoi : partage natif si dispo, sinon SMS ─── */
window.envoyerBilan = function (offset) {
  const txt = window.bilanTexte(offset);
  if (navigator.share) {
    navigator.share({ title: t("bil.title"), text: txt }).catch(() => {});
    return;
  }
  const num = (typeof COACH_PHONE !== "undefined" ? COACH_PHONE : "").replace(/[^+0-9]/g, "");
  const sep = /iphone|ipad|ipod/i.test(navigator.userAgent) ? "&" : "?";
  window.location.href = "sms:" + num + sep + "body=" + encodeURIComponent(txt);
};

/* ─── Aperçu dans une modale, avant envoi ─── */
window.voirBilan = function (offset) {
  const txt = window.bilanTexte(offset);
  const back = document.createElement("div");
  back.className = "modal-back";
  back.onclick = (ev) => { if (ev.target === back) back.remove(); };
  back.innerHTML = `<div class="modal">
    <button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button>
    <div class="modal-h">${t("bil.title")}</div>
    <div style="background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:14px;
      font-size:12.5px;line-height:1.65;white-space:pre-wrap;font-family:ui-monospace,monospace;
      max-height:46vh;overflow-y:auto;margin-bottom:14px">${txt.replace(/</g, "&lt;")}</div>
    <button class="btn p" onclick="envoyerBilan(${offset || 0})">${t("bil.send")}</button>
    <div style="text-align:center;font-size:10.5px;color:#5c5c62;margin-top:10px;line-height:1.6">${t("bil.hint")}</div>
  </div>`;
  document.body.appendChild(back);
};

/* ═══ RITUEL DE FIN DE SEMAINE ═══
   Photo (même endroit, même lumière) + pesée — pour nourrir le bilan.
   ⚠️ La pesée est FILTRÉE : jamais proposée si l'objectif est « me sentir mieux »
   ni si l'écran TCA a repéré un signal. Le protocole prime sur la fonctionnalité. */
window.peseeAutorisee = function () {
  if (!S.profile) return false;
  if (S.profile.objectif === "Me sentir mieux") return false;
  if (typeof nutriFlagged === "function" && nutriFlagged()) return false;
  return true;
};

window.rituelCard = function () {
  if (!S.profile) return "";
  const jour = (new Date().getDay() + 6) % 7;   /* 0 = lundi … 6 = dimanche */
  /* Fenêtre : samedi, dimanche, lundi */
  if (jour !== 5 && jour !== 6 && jour !== 0) return "";

  const lundi = mondayOf(new Date());
  const cleSem = lundi.toISOString().slice(0, 10);

  /* Photo déjà prise cette semaine ? */
  const photos = store.get("photos", []);
  const photoOK = photos.some(p => p.ts && new Date(p.ts) >= lundi);
  /* Pesée déjà faite cette semaine ? */
  const mes = S.measures || [];
  const peseeOK = mes.some(m => m.ts && new Date(m.ts) >= lundi);

  const avecPesee = window.peseeAutorisee();
  if (photoOK && (!avecPesee || peseeOK)) return "";   /* rituel accompli */

  const item = (fait, ico, titre, detail, action) => `
    <div class="rit-row ${fait ? "done" : ""}">
      <div class="rit-chk">${fait ? "✓" : ""}</div>
      <div style="flex:1">
        <div style="font-size:13.5px;font-weight:600">${ico} ${titre}</div>
        <div style="font-size:11px;color:var(--muted);line-height:1.5;margin-top:2px">${detail}</div>
      </div>
      ${fait ? "" : action}
    </div>`;

  return `<div class="card gold anim-item">
    <div class="eyebrow" style="margin-top:0">${t("rit.title")}</div>
    <div style="font-size:12px;color:var(--muted);line-height:1.55;margin-bottom:12px">${t("rit.intro")}</div>
    ${item(photoOK, "📸", t("rit.photo"), t("rit.photo.d"),
      `<button class="btn s" style="width:auto;padding:9px 14px;font-size:10.5px" onclick="document.getElementById('photoInput')?.click()||go('suivi')">${t("rit.do")}</button>`)}
    ${avecPesee ? item(peseeOK, "⚖️", t("rit.weight"), t("rit.weight.d"),
      `<button class="btn s" style="width:auto;padding:9px 14px;font-size:10.5px" onclick="go('suivi')">${t("rit.do")}</button>`) : ""}
  </div>`;
};


window.bilanCard = function () {
  if (!S.profile) return "";
  const lundi = mondayOf(new Date());
  const cle = "bilanEnvoye:" + lundi.toISOString().slice(0, 10);
  /* on propose le bilan de la semaine PASSÉE, du lundi au mercredi */
  const jour = (new Date().getDay() + 6) % 7; /* 0 = lundi */
  if (jour > 2) return "";
  if (store.get(cle, false)) return "";
  const passee = window.semaineData(-1);
  if (!passee.seances.length) return "";  /* rien à raconter */

  return `<div class="card gold glow anim-item" style="border-left:3px solid var(--gold)">
    <div class="eyebrow" style="margin-top:0">${t("bil.ready")}</div>
    <div style="font-size:13px;line-height:1.6;color:var(--muted);margin-bottom:12px">
      ${tf("bil.sum", passee.seances.length, passee.target)}
    </div>
    <div class="row">
      <button class="btn s" style="padding:12px;font-size:11px" onclick="voirBilan(-1)">${t("bil.see")}</button>
      <button class="btn p" style="padding:12px;font-size:11px" onclick="envoyerBilan(-1);store.set('${cle}',true)">${t("bil.send")}</button>
    </div>
  </div>`;
};

/* Premier rendu, une fois tous les modules chargés */
render();
