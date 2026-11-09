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

/* ─── Tonnage d'une semaine (séries × reps × charge) ─── */
function tonnage(seances) {
  let total = 0;
  seances.forEach(h => h.ex.forEach(e => {
    const w = parseFloat(String(e.load).replace(",", "."));
    if (isNaN(w) || !e.sets) return;
    const reps = e.cible || 10;
    /* séries pleines à la cible + la dernière série en AMRAP */
    const base = Math.max(0, e.sets - 1) * reps + (e.amrap || reps);
    total += w * base;
  }));
  return Math.round(total);
}

/* ─── Rédaction du bilan complet ─── */
window.bilanTexte = function (offset) {
  offset = offset || 0;
  const d = window.semaineData(offset);
  const prec = window.semaineData(offset - 1);
  const EN = LANG === "en";
  const fmt = (n) => String(n).replace(".", ",");
  const num = (n) => n.toLocaleString(EN ? "en-US" : "fr-FR");
  const dateStr = (x) => x.toLocaleDateString(EN ? "en-US" : "fr-FR", { day: "numeric", month: "short" });
  const fin = new Date(d.dimanche); fin.setDate(fin.getDate() - 1);
  const sep = "━━━━━━━━━━━━━━";
  const L = [];
  const T = (fr, en) => EN ? en : fr;

  /* ═ EN-TÊTE ═ */
  L.push(T(`📋 BILAN DE SEMAINE`, `📋 WEEKLY REPORT`));
  L.push(`${S.profile?.prenom || ""} · ${dateStr(d.lundi)} → ${dateStr(fin)}`);
  if (d.phase) L.push(T(`Phase : ${d.phase.n} — semaine ${d.phase.week}/${d.phase.len}`,
                        `Phase: ${d.phase.n} — week ${d.phase.week}/${d.phase.len}`));
  L.push("");

  /* ═ ASSIDUITÉ ═ */
  L.push(sep);
  L.push(T("🏋️ ASSIDUITÉ", "🏋️ ATTENDANCE"));
  const pctPres = Math.round(d.seances.length / d.target * 100);
  L.push(T(`Séances : ${d.seances.length}/${d.target}  (${pctPres} %)`,
           `Sessions: ${d.seances.length}/${d.target}  (${pctPres}%)`));
  L.push(T(`Semaine précédente : ${prec.seances.length}/${prec.target}`,
           `Previous week: ${prec.seances.length}/${prec.target}`));
  /* tendance 4 semaines */
  let tend = [];
  for (let k = 3; k >= 0; k--) tend.push(window.semaineData(offset - k).seances.length);
  while (tend.length > 1 && tend[0] === 0) tend.shift();   /* pas d'historique = on n'invente rien */
  if (tend.length > 1) L.push(T(`Tendance : ${tend.join(" · ")}`, `Trend: ${tend.join(" · ")}`));
  d.seances.forEach(h => L.push(`   • ${h.day} — ${h.focus}`));
  if (!d.seances.length) L.push(T("   (aucune séance)", "   (no sessions)"));
  L.push("");

  /* ═ VOLUME ═ */
  const tSem = tonnage(d.seances), tPrec = tonnage(prec.seances);
  if (tSem) {
    L.push(sep);
    L.push(T("📊 VOLUME DE TRAVAIL", "📊 WORK VOLUME"));
    L.push(T(`Tonnage : ${num(tSem)} kg soulevés`, `Tonnage: ${num(tSem)} kg lifted`));
    if (tPrec) {
      const dv = Math.round((tSem / tPrec - 1) * 100);
      L.push(T(`vs semaine passée : ${dv > 0 ? "+" : ""}${dv} %`, `vs last week: ${dv > 0 ? "+" : ""}${dv}%`));
      const pA = prec.seances[0]?.phase, pB = d.seances[0]?.phase;
      if (pA && pB && pA !== pB && dv < 0)
        L.push(T(`(normal : passage ${pA} → ${pB}, moins de reps par série)`,
                 `(normal: ${pA} → ${pB} shift, fewer reps per set)`));
    }
    L.push("");
  }

  /* ═ PROGRESSION PAR EXERCICE ═ */
  const keys = Object.keys(d.exos);
  if (keys.length) {
    L.push(sep);
    L.push(T("💪 PROGRESSION PAR EXERCICE", "💪 PROGRESS BY EXERCISE"));
    keys.forEach(n => {
      const pts = d.exos[n];
      const last = pts[pts.length - 1];
      L.push(`▸ ${n}`);
      let l1 = `   ${fmt(last.load)} kg`;
      if (last.amrap) {
        l1 += T(` × ${last.amrap} reps`, ` × ${last.amrap} reps`);
        if (last.cible) {
          const ec = last.amrap - last.cible;
          l1 += T(` (cible ${last.cible}${ec !== 0 ? ", " + (ec > 0 ? "+" : "") + ec : ", atteinte"})`,
                  ` (target ${last.cible}${ec !== 0 ? ", " + (ec > 0 ? "+" : "") + ec : ", met"})`);
        }
      }
      L.push(l1);
      /* progression depuis le début du cycle (tout l'historique) */
      const toutes = S.history.flatMap(h => h.ex.filter(e => e.n === n))
        .map(e => parseFloat(String(e.load).replace(",", "."))).filter(v => !isNaN(v));
      if (toutes.length >= 2) {
        const dep = toutes[0], arr = toutes[toutes.length - 1];
        const dd = Math.round((arr - dep) * 10) / 10;
        const pc = Math.round((arr / dep - 1) * 100);
        if (dd !== 0) L.push(T(`   Depuis le début : ${fmt(dep)} → ${fmt(arr)} kg (${dd > 0 ? "+" : ""}${fmt(dd)} kg, ${pc > 0 ? "+" : ""}${pc} %)`,
                               `   Since start: ${fmt(dep)} → ${fmt(arr)} kg (${dd > 0 ? "+" : ""}${fmt(dd)} kg, ${pc > 0 ? "+" : ""}${pc}%)`));
      }
    });
    L.push("");

    /* ═ CALIBRAGE DES CHARGES ═ */
    const ecarts = [];
    d.seances.forEach(h => h.ex.forEach(e => {
      if (e.amrap && e.cible) ecarts.push(e.amrap - e.cible);
    }));
    if (ecarts.length) {
      const moy = Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length * 10) / 10;
      L.push(sep);
      L.push(T("🎯 CALIBRAGE DES CHARGES", "🎯 LOAD CALIBRATION"));
      L.push(T(`Écart moyen à la cible : ${moy > 0 ? "+" : ""}${fmt(moy)} rep`,
               `Average gap to target: ${moy > 0 ? "+" : ""}${fmt(moy)} rep`));
      let verdict;
      if (moy < 0) verdict = T("→ Charges trop lourdes, elle n'atteint pas ses cibles", "→ Loads too heavy, targets not being met");
      else if (moy <= 1.5) verdict = T("→ Bien calibrée ✅", "→ Well calibrated ✅");
      else if (moy <= 3) verdict = T("→ Légèrement sous-chargée, ça monte", "→ Slightly under-loaded, moving up");
      else verdict = T("→ Nettement sous-chargée : vérifier la qualité des reps", "→ Clearly under-loaded: check rep quality");
      L.push(verdict);
      L.push("");
    }
  }

  /* ═ RÉCUPÉRATION ═ */
  if (d.checkins.length) {
    L.push(sep);
    L.push(T("😴 RÉCUPÉRATION", "😴 RECOVERY"));
    L.push(T(`Check-ins remplis : ${d.checkins.length}/7`, `Check-ins logged: ${d.checkins.length}/7`));
    const bons = d.checkins.filter(c => c.sommeil === "😴 Bon (7 h+)").length;
    L.push(T(`Sommeil : ${bons} bon(s), ${d.mauvaisSommeil} court(s)`,
             `Sleep: ${bons} good, ${d.mauvaisSommeil} short`));
    const nrj = { haute: 0, normale: 0, faible: 0 };
    d.checkins.forEach(c => { if (c.energie === "⚡ Haute") nrj.haute++; else if (c.energie === "🙂 Normale") nrj.normale++; else nrj.faible++; });
    L.push(T(`Énergie : ${nrj.haute} haute · ${nrj.normale} normale · ${nrj.faible} basse`,
             `Energy: ${nrj.haute} high · ${nrj.normale} normal · ${nrj.faible} low`));
    const courb = d.checkins.filter(c => c.corps === "😬 Courbatures fortes").length;
    if (courb) L.push(T(`Courbatures fortes : ${courb} jour(s)`, `Heavy soreness: ${courb} day(s)`));
    const pasMoy = Math.round(d.checkins.reduce((a, c) => a + c.steps, 0) / d.checkins.length);
    if (pasMoy) L.push(T(`Pas : ${num(pasMoy)}/jour en moyenne`, `Steps: ${num(pasMoy)}/day average`));
    const eauMoy = Math.round(d.checkins.reduce((a, c) => a + c.water, 0) / d.checkins.length * 10) / 10;
    if (eauMoy) L.push(T(`Hydratation : ${fmt(eauMoy)}/8 verres`, `Hydration: ${fmt(eauMoy)}/8 glasses`));
    L.push("");
  }

  /* ═ POIDS — uniquement si le protocole l'autorise ═ */
  if (window.peseeAutorisee && window.peseeAutorisee()) {
    const mes = (S.measures || []).filter(m => m.ts && m.poids);
    if (mes.length) {
      L.push(sep);
      L.push(T("⚖️ POIDS", "⚖️ WEIGHT"));
      const dernier = mes[mes.length - 1];
      L.push(`${fmt(dernier.poids)} kg`);
      if (mes.length >= 2) {
        const prev = mes[mes.length - 2];
        const dv = Math.round((parseFloat(String(dernier.poids).replace(",", ".")) - parseFloat(String(prev.poids).replace(",", "."))) * 10) / 10;
        if (!isNaN(dv)) L.push(T(`vs pesée précédente : ${dv > 0 ? "+" : ""}${fmt(dv)} kg`,
                                 `vs previous: ${dv > 0 ? "+" : ""}${fmt(dv)} kg`));
      }
      /* tendance sur 4 semaines */
      const il4 = Date.now() - 28 * 864e5;
      const anciens = mes.filter(m => m.ts >= il4);
      if (anciens.length >= 2) {
        const dv4 = Math.round((parseFloat(String(anciens[anciens.length - 1].poids).replace(",", ".")) - parseFloat(String(anciens[0].poids).replace(",", "."))) * 10) / 10;
        L.push(T(`Tendance 4 sem. : ${dv4 > 0 ? "+" : ""}${fmt(dv4)} kg`, `4-week trend: ${dv4 > 0 ? "+" : ""}${fmt(dv4)} kg`));
      }
      L.push(T("(la balance bouge, la tendance parle)", "(the scale moves, the trend talks)"));
      L.push("");
    }
  }

  /* ═ PHOTO ═ */
  const photosSem = store.get("photos", []).filter(p => p.ts && new Date(p.ts) >= d.lundi && new Date(p.ts) < d.dimanche);
  L.push(sep);
  L.push(T("📸 PHOTO", "📸 PHOTO"));
  L.push(photosSem.length
    ? T(`Prise ✅ (${photosSem.length}) — envoie-la à part si tu veux mon retour`,
        `Taken ✅ (${photosSem.length}) — send it separately for my feedback`)
    : T("Pas prise cette semaine", "Not taken this week"));
  L.push("");

  /* ═ POINTS D'ATTENTION ═ */
  const alertes = [];
  if (d.douleurs.length) alertes.push(T(`🔴 Douleur signalée : ${d.douleurs.length} jour(s) → à en parler`,
                                        `🔴 Pain reported: ${d.douleurs.length} day(s) → to discuss`));
  if (d.seances.length < d.target) alertes.push(T(`⚠️ ${d.target - d.seances.length} séance(s) manquée(s)`,
                                                  `⚠️ ${d.target - d.seances.length} session(s) missed`));
  if (d.mauvaisSommeil >= 3) alertes.push(T(`⚠️ Sommeil court ${d.mauvaisSommeil} jours — récupération à surveiller`,
                                            `⚠️ Short sleep ${d.mauvaisSommeil} days — watch recovery`));
  const phaseA = prec.seances[0]?.phase, phaseB = d.seances[0]?.phase;
  const memePhase = phaseA && phaseB && phaseA === phaseB;
  if (tPrec && tSem && tSem < tPrec * 0.8 && memePhase)
    alertes.push(T("⚠️ Volume en baisse de plus de 20 % à phase égale",
                   "⚠️ Volume down more than 20% within the same phase"));
  if (alertes.length) {
    L.push(sep);
    L.push(T("⚠️ POINTS D'ATTENTION", "⚠️ WATCH POINTS"));
    alertes.forEach(a => L.push(a));
    L.push("");
  }

  /* ═ SES NOTES ═ */
  if (d.notes.length) {
    L.push(sep);
    L.push(T("📝 SES NOTES", "📝 HER NOTES"));
    d.notes.slice(0, 8).forEach(n => L.push(`   • ${n}`));
    L.push("");
  }

  /* ═ LA SUITE ═ */
  const cyc = cycleFor(S.profile);
  if (cyc && d.phase) {
    const suivante = cyc[(d.phase.week) % cyc.length];
    L.push(sep);
    L.push(T("➡️ SEMAINE SUIVANTE", "➡️ NEXT WEEK"));
    L.push(T(`Phase : ${suivante.n} (${suivante.pct})`, `Phase: ${suivante.n} (${suivante.pct})`));
    if (suivante.reps) L.push(T(`Cibles : ${suivante.reps} reps · RIR ${suivante.rir}`,
                                `Targets: ${suivante.reps} reps · RIR ${suivante.rir}`));
    if (suivante.mult < 1) L.push(T("Semaine allégée — volontaire", "Light week — intentional"));
    L.push(T("Charges recalculées automatiquement.", "Loads recalculated automatically."));
    L.push("");
  }

  L.push(T("— PT Mouss IA · JIGI Coaching", "— PT Mouss IA · JIGI Coaching"));
  return L.join("\n");
};

/* ─── Envoi par WhatsApp (canal principal) ─── */
function coachNumWa() {
  /* wa.me exige le numéro sans + ni espaces */
  const n = (typeof COACH_PHONE !== "undefined" ? COACH_PHONE : "");
  return n.replace(/[^0-9]/g, "");
}
window.envoyerBilan = function (offset) {
  const txt = window.bilanTexte(offset);
  const url = "https://wa.me/" + coachNumWa() + "?text=" + encodeURIComponent(txt);
  window.open(url, "_blank");
};
/* Repli : SMS, si WhatsApp n'est pas installé */
window.envoyerBilanSMS = function (offset) {
  const txt = window.bilanTexte(offset);
  const num = (typeof COACH_PHONE !== "undefined" ? COACH_PHONE : "").replace(/[^+0-9]/g, "");
  const sep = /iphone|ipad|ipod/i.test(navigator.userAgent) ? "&" : "?";
  window.location.href = "sms:" + num + sep + "body=" + encodeURIComponent(txt);
};
/* Partage natif : pour choisir soi-même l'application */
window.partagerBilan = function (offset) {
  const txt = window.bilanTexte(offset);
  if (navigator.share) { navigator.share({ title: t("bil.title"), text: txt }).catch(() => {}); }
  else { window.envoyerBilan(offset); }
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
    <div class="row" style="margin-top:9px">
      <button class="btn s" style="padding:12px;font-size:11px" onclick="partagerBilan(${offset || 0})">${t("bil.other")}</button>
      <button class="btn s" style="padding:12px;font-size:11px" onclick="envoyerBilanSMS(${offset || 0})">${t("bil.sms")}</button>
    </div>
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
