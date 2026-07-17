/* ═══════════════════════════════════════════════
   PT MOUSS IA — Modules v4
   Phases + RM Test · Sélecteur de semaine · Comparaison de cycles
   Fiche exercice détaillée · Nutrition (écran TCA)
   (dépend de app.js : S, store, weekNum, buildProgram, loadGains, render, $)
   ═══════════════════════════════════════════════ */

/* ═══ EXPLICATIONS DES PHASES ═══ */
window.PHASE_INFO = {
  "RM TEST": { but: "Trouver tes charges de référence pour tout le cycle.", pourquoi: "Sans point de départ mesuré, impossible de calculer les % des semaines suivantes. C'est ta ligne de base.", comment: "Échauffe-toi longuement. Monte progressivement en charge sur 4-5 séries. Cherche le poids que tu peux faire pour ~5 belles reps — PAS ton max absolu. Arrête-toi dès que la technique se dégrade." , secu: "🔴 Jamais de test lourd seul sans pareur. La dernière rep propre, pas la rep de trop." },
  "HYPERTROPHY": { but: "Construire du muscle par le volume.", pourquoi: "70 % avec 10-12 reps, c'est la zone reine de la croissance musculaire : assez lourd pour stimuler, assez de reps pour le volume.", comment: "Technique irréprochable, tempo contrôlé, 2-3 reps en réserve (RIR). Drop set sur la dernière série des gros exercices.", secu: "La fatigue monte : dors et mange en conséquence." },
  "HYPERTROPHY+": { but: "Densifier — plus d'intensité, toujours du volume.", pourquoi: "On monte à 75-80 % : le muscle est prêt à encaisser plus. Les charges commencent à grimper.", comment: "8-12 reps, 1-2 en réserve. C'est là qu'on gagne le plus de force nerveuse ET de muscle.", secu: "Si la technique casse, la charge est trop lourde — redescends." },
  "DELOAD": { but: "Récupérer pour mieux repartir.", pourquoi: "Le muscle ne se construit pas à la salle, mais pendant la récupération. Une semaine allégée permet d'encaisser le bloc suivant plus fort. C'est la spécificité JIGI : le deload est au MILIEU du cycle, pas à la fin.", comment: "50-60 % de charge, reps faciles, 3-4 reps en réserve. Aucun drop set. Tu dois finir frais.", secu: "🟢 Ne rajoute RIEN cette semaine. C'est le programme, pas de la paresse." },
  "FORCE": { but: "Développer la force pure.", pourquoi: "80-85 %, 6-8 reps : on entraîne le système nerveux à recruter plus de fibres. La force construite ici te permettra de soulever plus lourd en hypertrophie au cycle suivant.", comment: "Repos plus longs (2-3 min), concentration maximale, technique parfaite sur chaque rep.", secu: "Charges lourdes = échauffement d'autant plus important." },
  "FORCE+": { but: "Force maximale.", pourquoi: "90 %, 4-6 reps : le haut de la pyramide de force. Peu de reps, beaucoup d'intensité nerveuse.", comment: "Repos complets (3 min). Chaque série compte. Pas d'échec technique.", secu: "🔴 Pareur obligatoire sur les gros mouvements." },
  "PEAK": { but: "Le sommet du cycle.", pourquoi: "95 %, 2-3 reps : tu exprimes tout ce que tu as construit. Qualité pure.", comment: "Volume réduit, intensité max. Échauffement très progressif. Qualité > quantité.", secu: "🔴 Le plus exigeant nerveusement. Repos complets, pareur, zéro rep de trop." },
  "RETEST": { but: "Mesurer tes progrès.", pourquoi: "On refait le test de la semaine 1. La différence, c'est ta progression réelle sur le cycle — noir sur blanc.", comment: "Même protocole que le RM Test initial. Compare, note, célèbre.", secu: "Même prudence que le premier test." },
  "MAINTIEN 1": { but: "Garder le muscle pendant le déficit.", pourquoi: "En perte de gras, la salle ne sert pas à brûler — elle sert à dire au corps « garde ce muscle ». La nutrition et les pas font le déficit.", comment: "Charges maintenues, 6-10 reps. Si tu tiens tes charges, tu gagnes.", secu: "Force stable = victoire. Si elle chute → le déficit est trop agressif." },
  "MAINTIEN 2": { but: "Garder le muscle pendant le déficit.", pourquoi: "Semaine après semaine, l'objectif reste le même : préserver la force en déficit.", comment: "Charges maintenues. Écoute ta récupération.", secu: "Sommeil et protéines : tes meilleurs alliés ici." },
  "MAINTIEN 3": { but: "Garder le muscle pendant le déficit.", pourquoi: "3ᵉ semaine de charge : surveille les signaux de fatigue.", comment: "Charges maintenues. Prépare la semaine allégée.", secu: "🔴 Si la force chute nettement → on corrige, on ne serre pas la vis." },
  "ALLÉGÉE": { but: "Récupérer en déficit.", pourquoi: "En déficit, la récupération est réduite : une semaine plus légère protège la suite et évite le surmenage.", comment: "60 %, reps faciles. On souffle.", secu: "Ne compense pas par plus de cardio." },
  "DÉCOUVERTE 1": { but: "Apprendre les mouvements en douceur.", pourquoi: "L'objectif « me sentir mieux » ne cherche pas la performance mais l'habitude. On sous-charge volontairement.", comment: "12-15 reps faciles, 3-4 en réserve. Jamais d'échec. Tu dois finir en te disant « j'aurais pu en faire plus ».", secu: "La victoire, c'est de revenir la semaine prochaine." },
  "DÉCOUVERTE 2": { but: "Ancrer l'habitude.", pourquoi: "La régularité prime sur l'intensité. Deux séances tranquilles valent mieux qu'une séance héroïque.", comment: "Même logique, tout en douceur.", secu: "Aucune pression. Le plaisir d'abord." },
  "CONSTRUCTION 1": { but: "Progresser en douceur.", pourquoi: "Le corps s'est habitué : on peut ajouter un peu, sans forcer.", comment: "12-15 reps, charge modérée. Toujours de la réserve.", secu: "On écoute le corps, pas l'ego." },
  "CONSTRUCTION 2": { but: "Consolider.", pourquoi: "La régularité paie déjà : énergie, sommeil, humeur.", comment: "Charge modérée. On maintient le cap.", secu: "Célèbre la régularité, pas la charge." },
  "CONSTRUCTION 3": { but: "Tenir le rythme.", pourquoi: "Tu tiens depuis plusieurs semaines : c'est ça, la vraie réussite.", comment: "Charge modérée. Prépare la semaine douce.", secu: "Une absence ? On repart plus petit, jamais rattraper." },
  "DOUCE": { but: "Souffler.", pourquoi: "Même en douceur, le corps a besoin de vraies pauses.", comment: "Très léger. Marche, mobilité, plaisir.", secu: "Repos = partie du programme." },
};

/* ═══ MODAL FICHE EXERCICE ═══ */
window.openEx = (name) => {
  const e = window.EXDB?.[name];
  const back = document.createElement("div");
  back.className = "modal-back";
  back.onclick = (ev) => { if (ev.target === back) back.remove(); };
  if (!e) {
    back.innerHTML = `<div class="modal"><button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button>
      <div class="modal-h">${name}</div>
      <div style="color:var(--muted);font-size:13.5px;line-height:1.6;padding:10px 0">
        ${t("ex.nofiche")}</div></div>`;
    document.body.appendChild(back); return;
  }
  const tag = (l, v) => v ? `<div class="ex-row"><span class="ex-k">${l}</span><span class="ex-v">${v}</span></div>` : "";
  const list = (arr) => arr.map(x => `<li>${x}</li>`).join("");
  back.innerHTML = `<div class="modal">
    <button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button>
    <div class="modal-h">${name}</div>
    <div class="ex-tags">
      <span class="badge" style="color:var(--gold);border:1px solid var(--gold-line)">${e.groupe}</span>
      <span class="badge" style="color:var(--muted);border:1px solid var(--line)">${e.diff}</span>
    </div>

    <div class="ex-block">
      ${tag(t("ex.primary"), e.primaires)}
      ${tag(t("ex.secondary"), e.secondaires)}
      ${tag(t("ex.equip"), e.materiel)}
      ${tag(t("ex.tempo"), e.tempo)}
      ${tag(t("ex.rest"), e.repos)}
    </div>

    <div class="ex-sec"><div class="ex-sec-t">${t("ex.start")}</div><p>${e.depart}</p></div>
    <div class="ex-sec"><div class="ex-sec-t">${t("ex.end")}</div><p>${e.arrivee}</p></div>

    <div class="ex-sec"><div class="ex-sec-t" style="color:var(--gold)">${t("ex.cues")}</div><ul>${list(e.points)}</ul></div>
    <div class="ex-sec"><div class="ex-sec-t" style="color:var(--ko)">${t("ex.errors")}</div><ul>${list(e.erreurs)}</ul></div>

    <div class="ex-coach"><div style="display:flex;gap:9px"><div class="ex-m">M</div>
      <div style="font-size:13.5px;line-height:1.6">${e.coach}</div></div></div>

    <div class="ex-sec"><div class="ex-sec-t">${t("ex.variants")}</div>
      <div class="ex-row"><span class="ex-k">${t("ex.beg")}</span><span class="ex-v">${e.variantes.deb}</span></div>
      <div class="ex-row"><span class="ex-k">${t("ex.int")}</span><span class="ex-v">${e.variantes.int}</span></div>
      <div class="ex-row"><span class="ex-k">${t("ex.adv")}</span><span class="ex-v">${e.variantes.av}</span></div>
    </div>
    <div class="ex-sec"><div class="ex-sec-t">${t("ex.alt")}</div><p>${e.alternatives}</p></div>

    ${e.video ? `<a href="${e.video}" target="_blank" rel="noopener" class="btn p" style="display:block;text-align:center;text-decoration:none;margin-bottom:6px">${t("ex.video")}</a>
    <div style="text-align:center;font-size:10px;color:#4c4c52;margin-bottom:10px">${t("ex.video.note")}</div>` : ""}

    <div style="text-align:center;font-size:10px;color:#4c4c52;margin-top:14px;line-height:1.6">
      ${t("ex.footer")}</div>
  </div>`;
  document.body.appendChild(back);
  if (navigator.vibrate) navigator.vibrate(20);
};

/* ═══ MODAL PHASE / RM TEST ═══ */
window.openPhase = (phaseName) => {
  const key = phaseName.split(" — ").pop().split("/")[0].trim();
  const info = window.PHASE_INFO?.[key] || window.PHASE_INFO?.[Object.keys(window.PHASE_INFO).find(k => key.startsWith(k))];
  const back = document.createElement("div");
  back.className = "modal-back";
  back.onclick = (ev) => { if (ev.target === back) back.remove(); };
  if (!info) { back.innerHTML = `<div class="modal"><button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button><div class="modal-h">${key}</div><p style="color:var(--muted)">Phase du cycle.</p></div>`; document.body.appendChild(back); return; }
  back.innerHTML = `<div class="modal">
    <button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button>
    <div class="modal-h">${key}</div>
    <div class="ex-sec"><div class="ex-sec-t" style="color:var(--gold)">${t("ph.goal")}</div><p>${info.but}</p></div>
    <div class="ex-sec"><div class="ex-sec-t">${t("ph.why")}</div><p>${info.pourquoi}</p></div>
    <div class="ex-sec"><div class="ex-sec-t">${t("ph.how")}</div><p>${info.comment}</p></div>
    <div class="ex-coach" style="border-color:${info.secu.includes("🔴") ? "rgba(229,72,77,.4)" : "var(--gold-line)"}">
      <div style="font-size:13.5px;line-height:1.6">${info.secu}</div></div>
  </div>`;
  document.body.appendChild(back);
};

/* ═══ SÉLECTEUR DE SEMAINE ═══ */
window.openWeekPicker = () => {
  const cyc = cycleFor(S.profile);
  if (!cyc) return;
  const cur = weekNum() % cyc.length;
  const back = document.createElement("div");
  back.className = "modal-back";
  back.onclick = (ev) => { if (ev.target === back) back.remove(); };
  back.innerHTML = `<div class="modal">
    <button class="modal-x" onclick="this.closest('.modal-back').remove()">✕</button>
    <div class="modal-h">${t("wk.title")}</div>
    <p style="color:var(--muted);font-size:12.5px;line-height:1.6;margin-bottom:14px">
      ${t("wk.sub")}</p>
    ${cyc.map((c, i) => `<div class="choice ${i === cur ? "sel" : ""}" style="padding:13px 15px;margin-bottom:7px" onclick="setWeek(${i})">
      <div><div style="font-family:Oswald;font-size:14px">${t("wk.week")} ${i + 1} — ${c.n}</div>
      <div style="font-size:10.5px;color:var(--muted);margin-top:2px">${c.pct}${c.reps ? " · " + c.reps + " reps" : ""}</div></div>
      <span class="chk">✓</span></div>`).join("")}
  </div>`;
  document.body.appendChild(back);
};
window.setWeek = (i) => {
  const cyc = cycleFor(S.profile);
  const curCycle = Math.floor(weekNum() / cyc.length);
  const targetWeek = curCycle * cyc.length + i;
  S.profile.start = Date.now() - targetWeek * 7 * 864e5;
  store.set("profile", S.profile);
  store.set("lastSeenWeek", targetWeek);
  document.querySelector(".modal-back")?.remove();
  render();
};

/* ═══ COMPARAISON DE CYCLES ═══ */
window.cyclesCompare = () => {
  const cyc = cycleFor(S.profile);
  if (!cyc || !S.history.length) return "";
  const len = cyc.length;
  const byCycle = {};
  S.history.forEach(h => {
    if (!h.iso) return;
    const w = Math.floor((new Date(h.iso) - S.profile.start) / (7 * 864e5));
    const c = Math.floor(w / len) + 1;
    h.ex.forEach(e => {
      const v = parseFloat(String(e.load).replace(",", "."));
      if (isNaN(v)) return;
      (byCycle[e.n] = byCycle[e.n] || {});
      byCycle[e.n][c] = Math.max(byCycle[e.n][c] || 0, v);
    });
  });
  const multi = Object.entries(byCycle).filter(([, v]) => Object.keys(v).length >= 2);
  if (!multi.length) return "";
  return `<div class="eyebrow">${t("cyc.compare")}</div>
    ${multi.map(([n, cycles]) => {
      const ks = Object.keys(cycles).map(Number).sort();
      const first = cycles[ks[0]], last = cycles[ks[ks.length - 1]];
      const d = last - first;
      return `<div class="card anim-item">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:600;font-size:13.5px">${n}</div>
          <div style="font-family:Oswald;font-size:14px;color:${d > 0 ? "var(--ok)" : "var(--muted)"}">${d > 0 ? "+" : ""}${d.toFixed(1)} kg</div></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          ${ks.map(k => `<div style="flex:1;text-align:center;background:var(--panel2);border-radius:9px;padding:8px">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase">${t("cyc.cycle")} ${k}</div>
            <div style="font-family:Oswald;font-size:15px;color:var(--gold);margin-top:3px">${cycles[k]} kg</div></div>`).join('<div style="align-self:center;color:var(--muted)">→</div>')}
        </div></div>`;
    }).join("")}`;
};

/* ═══ NUTRITION (écran TCA → bilan → repères) ═══
   Valeurs `o` et `risk` en FR = identifiants (jamais traduits, sinon la détection casse).
   `qk`/`ok` = clés i18n pour l'affichage, évaluées au rendu. */
const TCA_Q = [
  { k: "vitesse", qk: "nu.q.vitesse", risk: "Oui, le plus vite possible", o: ["Non", "Progressivement", "Oui, le plus vite possible"] },
  { k: "balance", qk: "nu.q.balance", risk: "Tous les jours ou plus", o: ["Rarement", "1×/semaine", "Tous les jours ou plus"] },
  { k: "culpa", qk: "nu.q.culpa", risk: "Souvent", o: ["Jamais", "Parfois", "Souvent"] },
  { k: "tca", qk: "nu.q.tca", risk: "Oui / je préfère ne pas répondre", o: ["Non", "Oui", "Je préfère ne pas répondre"] },
];
const NU_LABEL = {
  "Non": "nu.v.non", "Progressivement": "nu.v.progr", "Oui, le plus vite possible": "nu.v.fast",
  "Rarement": "nu.v.rare", "1×/semaine": "nu.v.week", "Tous les jours ou plus": "nu.v.daily",
  "Jamais": "nu.v.never", "Parfois": "nu.v.sometimes", "Souvent": "nu.v.often",
  "Oui": "nu.v.yes", "Je préfère ne pas répondre": "nu.v.rather",
};
const nuLabel = (v) => NU_LABEL[v] ? t(NU_LABEL[v]) : v;
function nutriFlagged() {
  const n = store.get("nutriScreen", null);
  if (!n) return null;
  return TCA_Q.some(q => {
    if (q.k === "tca") return n.tca === "Oui" || n.tca === "Je préfère ne pas répondre";
    return n[q.k] === q.risk;
  });
}
window.viewNutri = function () {
  const screen = store.get("nutriScreen", null);
  const N = nutri(S.profile);

  if (!screen) {
    const i = S.nutriStep || 0;
    const q = TCA_Q[i];
    return `<div class="h1">${t("nu.title")}</div>
      <div class="sub">${t("nu.intro")}</div>
      <div class="progress-dots">${TCA_Q.map((_, k) => `<div class="pdot ${k <= i ? "on" : ""}"></div>`).join("")}</div>
      <div style="font-family:Oswald;font-weight:600;font-size:19px;text-transform:uppercase;margin:10px 0 14px" class="anim-item">${t(q.qk)}</div>
      ${q.o.map(o => `<div class="choice anim-item" onclick="nutriAns('${q.k}',\`${o}\`)">${nuLabel(o)}<span class="chk"></span></div>`).join("")}`;
  }

  const flag = nutriFlagged();
  if (flag) {
    return `<div class="h1">${t("nu.title")}</div>
      <div class="card gold anim-item" style="margin-top:8px">
        <div style="display:flex;gap:11px;margin-bottom:12px">
          <div class="ex-m" style="width:36px;height:36px;font-size:16px">M</div>
          <div style="font-family:Oswald;font-size:11px;letter-spacing:.14em;color:var(--gold);text-transform:uppercase;padding-top:9px">${t("nu.coach")}</div></div>
        <div style="font-size:14.5px;line-height:1.65">${t("nu.blocked")}</div></div>
      <div class="eyebrow">${t("nu.plate")}</div>
      ${[["🍗","nu.p1","nu.p1d"],["🥦","nu.p2","nu.p2d"],["🍚","nu.p3","nu.p3d"],["🫒","nu.p4","nu.p4d"],["💧","nu.p5","nu.p5d"]].map(([e,tk,dk])=>
        `<div class="card anim-item" style="display:flex;gap:12px;padding:14px"><div style="font-size:22px">${e}</div>
          <div><div style="font-weight:600;font-size:14px">${t(tk)}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${t(dk)}</div></div></div>`).join("")}
      <div class="card anim-item" style="border-left:3px solid var(--ok)">
        <div style="font-size:13px;line-height:1.6">${t("nu.energy")}</div></div>
      <div style="text-align:center;font-size:11px;color:#5c5c62;margin-top:16px;line-height:1.7">${t("nu.help")}</div>
      <button class="btn s anim-item" style="margin-top:14px" onclick="store.set('nutriScreen',null);S.nutriStep=0;render()">${t("nu.redo")}</button>`;
  }

  /* Mode chiffré autorisé — repères qualitatifs par objectif (PAS de compteur) */
  return `<div class="h1">${t("nu.title")}</div>
    <div class="sub">${N.t}</div>
    ${N.pts.map((x,i) => `<div class="card anim-item" style="animation-delay:${i*50}ms;font-size:13.5px;line-height:1.6">${x}</div>`).join("")}
    <div class="card gold anim-item">
      <div class="eyebrow" style="margin-top:0">${t("nu.plan.t")}</div>
      <div style="font-size:13.5px;line-height:1.65;color:var(--muted)">${t("nu.plan.d")}</div></div>
    <div class="card anim-item" style="border-left:3px solid var(--gold)">
      <div style="font-size:12.5px;line-height:1.6">${t("nu.timing")}</div></div>
    <button class="btn s anim-item" onclick="store.set('nutriScreen',null);S.nutriStep=0;render()">${t("nu.redo")}</button>
    <div style="text-align:center;font-size:10px;color:#4c4c52;margin-top:14px">${t("nu.footer")}</div>`;
};
window.nutriAns = (k, o) => {
  const tmp = S.nutriTmp || (S.nutriTmp = {});
  tmp[k] = o;
  const i = (S.nutriStep || 0);
  if (i < TCA_Q.length - 1) { S.nutriStep = i + 1; }
  else { store.set("nutriScreen", { ...tmp }); S.nutriStep = 0; S.nutriTmp = {}; }
  render();
};
