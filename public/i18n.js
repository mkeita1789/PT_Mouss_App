/* ═══════════════════════════════════════════════
   PT MOUSS IA — Bilingue FR / EN
   window.LANG = "fr" | "en"  ·  t("clé")
   ═══════════════════════════════════════════════ */
(function () {
  const saved = (() => { try { return localStorage.getItem("lang"); } catch (e) { return null; } })();
  window.LANG = saved === "en" ? "en" : "fr";
  window.setLang = (l) => { window.LANG = l; try { localStorage.setItem("lang", l); } catch (e) {} if (window.render) render(); };

  const T = {
    /* ─ Général / nav ─ */
    "tab.home": ["Accueil", "Home"],
    "tab.prog": ["Programme", "Program"],
    "tab.coach": ["Coach", "Coach"],
    "tab.suivi": ["Progression", "Progress"],
    "tab.profil": ["Profil", "Profile"],
    "seance.tab": ["Séance", "Workout"],
    "tracker": ["tracker ›", "tracker ›"],
    "motto": ["« Discipline today, results tomorrow »", "« Discipline today, results tomorrow »"],

    /* ─ Salutations ─ */
    "hi.morning": ["Bonjour", "Good morning"],
    "hi.day": ["Salut", "Hi"],
    "hi.evening": ["Bonsoir", "Good evening"],

    /* ─ Bilan ─ */
    "bilan.title": ["Ton <em>bilan</em>", "Your <em>assessment</em>"],
    "bilan.q": ["Question", "Question"],
    "bilan.of": ["/", "of"],
    "bilan.back": ["Retour", "Back"],
    "bilan.next": ["Suivant", "Next"],
    "bilan.finish": ["✓ Terminer", "✓ Finish"],
    "q.prenom": ["Comment tu t'appelles ?", "What's your name?"],
    "q.prenom.ph": ["Ton prénom", "Your first name"],
    "q.objectif": ["Ton objectif principal ?", "Your main goal?"],
    "q.niveau": ["Où tu en es ?", "Where are you at?"],
    "q.freq": ["Combien de séances par semaine ?", "How many sessions per week?"],
    "q.materiel": ["Où t'entraînes-tu ?", "Where do you train?"],
    "q.sante": ["Un point de vigilance santé ?", "Any health concern?"],
    "q.sommeil": ["Tu dors combien ?", "How much do you sleep?"],
    "q.periode": ["Tu es dans quelle période ?", "What phase are you in?"],
    "q.allure": ["Ton allure de footing ?", "Your running pace?"],
    /* options objectif */
    "o.fessiers": ["Développer mes fessiers 🍑", "Build my glutes 🍑"],
    "o.muscle": ["Prendre du muscle", "Build muscle"],
    "o.gras": ["Perdre du gras", "Lose fat"],
    "o.perf": ["Performance sportive ⚽", "Sports performance ⚽"],
    "o.bien": ["Me sentir mieux", "Feel better"],
    /* options niveau */
    "o.debute": ["Je débute", "I'm a beginner"],
    "o.deja": ["J'ai déjà pratiqué", "I've trained before"],
    "o.regulier": ["Je m'entraîne régulièrement", "I train regularly"],
    "o.avance": ["Niveau avancé", "Advanced"],
    /* fréquence */
    "o.2": ["2", "2"], "o.3": ["3", "3"], "o.4": ["4", "4"], "o.5plus": ["5 ou +", "5 or +"],
    /* matériel */
    "o.salle": ["En salle", "At the gym"],
    "o.maison": ["À la maison", "At home"],
    "o.deux": ["Les deux", "Both"],
    /* santé */
    "o.aucun": ["Aucun", "None"],
    "o.dos": ["Dos sensible", "Sensitive back"],
    "o.genoux": ["Genoux", "Knees"],
    "o.epaules": ["Épaules", "Shoulders"],
    /* sommeil */
    "o.sleep6-": ["Moins de 6 h", "Less than 6 h"],
    "o.sleep67": ["6-7 h", "6-7 h"],
    "o.sleep78": ["7-8 h", "7-8 h"],
    "o.sleep8+": ["Plus de 8 h", "More than 8 h"],
    /* période foot */
    "o.coupure": ["Coupure / vacances", "Off-season break"],
    "o.presaison": ["Pré-saison", "Pre-season"],
    "o.saison": ["En saison", "In-season"],
    "o.nocomp": ["Pas de compétition", "No competition"],
    /* allure */
    "o.p14": ["14 km/h (4'20)", "14 km/h (6:58/mi)"],
    "o.p13": ["13 km/h (4'40)", "13 km/h (7:30/mi)"],
    "o.p12": ["12 km/h (5'00)", "12 km/h (8:03/mi)"],
    "o.p11": ["11 km/h ou moins", "11 km/h or less"],

    /* ─ Accueil ─ */
    "home.checkin": ["Check-in du jour", "Daily check-in"],
    "home.checkin.sub": ["20 secondes", "20 seconds"],
    "ci.sommeil": ["Ton sommeil cette nuit ?", "How did you sleep?"],
    "ci.energie": ["Ton énergie là, maintenant ?", "Your energy right now?"],
    "ci.corps": ["Ton corps ?", "Your body?"],
    "ci.s.bon": ["😴 Bon (7 h+)", "😴 Good (7 h+)"],
    "ci.s.ok": ["🙂 Correct", "🙂 OK"],
    "ci.s.bad": ["😵 Mauvais (<6 h)", "😵 Poor (<6 h)"],
    "ci.e.high": ["⚡ Haute", "⚡ High"],
    "ci.e.norm": ["🙂 Normale", "🙂 Normal"],
    "ci.e.low": ["🪫 Faible", "🪫 Low"],
    "ci.c.fresh": ["✅ Frais", "✅ Fresh"],
    "ci.c.sore": ["😬 Courbatures fortes", "😬 Very sore"],
    "ci.c.pain": ["🔴 Une douleur", "🔴 Pain"],
    "home.score": ["Forme", "Readiness"],
    "home.session": ["Séance du jour", "Today's session"],
    "verdict.MAINTENIR": ["MAINTENIR", "GO FULL"],
    "verdict.ALLÉGER": ["ALLÉGER", "EASE OFF"],
    "verdict.REPORTER": ["REPORTER", "POSTPONE"],
    "v.pain": ["Une douleur, ce n'est pas une courbature. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé, et préviens Moustapha.", "Pain isn't soreness. You don't train through it. If it lasts: see a healthcare professional, and tell Moustapha."],
    "v.ease": ["Aujourd'hui : −1 série par exercice, garde 1-2 reps de plus en réserve. Une séance allégée vaut mieux qu'une séance sautée.", "Today: −1 set per exercise, keep 1-2 more reps in reserve. An easier session beats a skipped one."],
    "v.go": ["Tu es opérationnel. Séance normale — vas-y.", "You're good to go. Normal session — let's move."],
    "home.redo": ["↺ Refaire le check-in", "↺ Redo check-in"],
    "home.week": ["Séances cette semaine", "Sessions this week"],
    "home.total": ["Total séances", "Total sessions"],
    "home.hydra": ["💧 Hydratation", "💧 Hydration"],
    "home.steps": ["🚶 Pas du jour", "🚶 Steps today"],
    "home.launch": ["🔥 Lancer ma séance", "🔥 Start my workout"],

    /* ─ Programme ─ */
    "prog.empty.t": ["Fais ton bilan", "Complete your assessment"],
    "prog.empty.s": ["Ton programme en découle.", "Your program follows from it."],
    "prog.proto": ["PROTOCOLE", "PROTOCOL"],
    "prog.official": ["✅ Méthode officielle", "✅ Official method"],
    "prog.tovalidate": ["🔶 À valider par le coach", "🔶 To be validated by the coach"],
    "prog.deload.badge": ["SEMAINE LÉGÈRE — C'EST VOLONTAIRE", "LIGHT WEEK — ON PURPOSE"],
    "prog.week": ["Semaine", "Week"],
    "prog.assiette": ["🍽️ Côté assiette", "🍽️ Nutrition"],
    "prog.thisweek": ["Cette semaine", "This week"],
    "prog.volume": ["Volume hebdo", "Weekly volume"],
    "prog.zone": ["zone", "zone"],
    "prog.measure": ["📈 Ce qu'on mesure", "📈 What we track"],
    "prog.launch": ["🔥 Lancer la séance", "🔥 Start the session"],
    "prog.footer": ["Pré-programme · à valider par le coach · pas un avis médical", "Draft program · to be validated by the coach · not medical advice"],
    "prog.roadmap": ["🗺️ Ton cycle — où tu en es", "🗺️ Your cycle — where you are"],
    "prog.roadmap.foot": ["La phase suivante démarre lundi prochain. Si une semaine s'est mal passée, dis-le au coach — on ajuste, on n'enchaîne pas bêtement.", "The next phase starts next Monday. If a week went badly, tell the coach — we adjust, we don't just plow ahead."],
    "prog.season": ["🗺️ Ta saison", "🗺️ Your season"],
    "prog.season.foot": ["Le passage d'une période à l'autre se décide avec le coach — pas automatiquement.", "Moving from one phase to the next is decided with the coach — not automatically."],

    /* ─ Séance ─ */
    "s.empty.t": ["Fais ton bilan", "Complete your assessment"],
    "s.empty.s": ["Puis lance ta première séance.", "Then start your first session."],
    "s.repos.t": ["Repos imposé", "Rest imposed"],
    "s.repos.s": ["Pas de séance à tracker. C'est volontaire — le repos fait partie du programme.", "Nothing to track. It's intentional — rest is part of the program."],
    "s.checkin.reporter": ["🔴 Check-in : REPORTER", "🔴 Check-in: POSTPONE"],
    "s.checkin.alleger": ["🟡 Check-in : séance allégée", "🟡 Check-in: lighter session"],
    "s.reporter.msg": ["Ton corps a parlé ce matin. Reporter n'est pas abandonner.", "Your body spoke this morning. Postponing isn't quitting."],
    "s.alleger.msg": ["−1 série par exercice appliquée automatiquement. Garde de la réserve.", "−1 set per exercise applied automatically. Keep some in reserve."],
    "s.sets": ["séries", "sets"],
    "s.lasttime": ["Dernière fois", "Last time"],
    "s.allsets": ["toutes séries faites", "all sets done"],
    "s.aim": ["vise", "aim for"],
    "s.consolidate": ["même charge, consolide", "same load, consolidate"],
    "s.rpe.q": ["C'était dur comment ? (RPE)", "How hard was it? (RPE)"],
    "s.note.ph": ["Note (optionnel) : sensation, douleur, matériel…", "Note (optional): feel, pain, equipment…"],
    "s.done": ["Séance terminée 🔥", "Session complete 🔥"],
    "s.done.sub": ["Charges, RPE et notes seront rechargés la prochaine fois.", "Loads, RPE and notes will be reloaded next time."],
    "s.save": ["💾 Enregistrer", "💾 Save"],
    "s.rest": ["Repos — respire", "Rest — breathe"],
    "s.skip": ["Passer", "Skip"],

    /* ─ Coach ─ */
    "coach.title": ["Ton <em>coach</em>", "Your <em>coach</em>"],
    "coach.sub": ["Questions courantes ici. Pour la douleur, la nutrition ou le moral → Moustapha directement.", "Common questions here. For pain, nutrition or mood → Moustapha directly."],
    "coach.placeholder": ["Écris au coach…", "Message the coach…"],
    "coach.empty": ["Pose-moi une question sur ta séance,<br>ou choisis un sujet ⤵", "Ask me about your session,<br>or pick a topic ⤵"],

    /* ─ Progression ─ */
    "sv.title": ["Ta <em>progression</em>", "Your <em>progress</em>"],
    "sv.sessions": ["séance", "session"],
    "sv.badges": ["🏅 Badges", "🏅 Badges"],
    "sv.charges": ["Progression des charges", "Load progression"],
    "sv.measures": ["📏 Mensurations", "📏 Measurements"],
    "sv.weight.ph": ["Poids (kg)", "Weight (kg)"],
    "sv.hips.ph": ["Hanches (cm)", "Hips (cm)"],
    "sv.save": ["＋ Enregistrer", "＋ Save"],
    "sv.history": ["Historique", "History"],
    "sv.rpeavg": ["RPE moyen", "avg RPE"],
    "sv.empty": ["Termine une séance : elle apparaîtra ici.", "Finish a session: it'll show up here."],
    "sv.scale.warn": ["⚖️ 1× par semaine max, à jeun, même jour. La balance ment — la tendance sur un mois, elle, dit vrai.", "⚖️ Once a week max, fasted, same day. The scale lies — the monthly trend tells the truth."],
    "sv.bien": ["🌿 Ici, on ne suit <b>pas le poids</b> — c'est le protocole. Ce qu'on regarde : ton énergie, ton sommeil, et le fait que tu reviennes. Et tu reviens. 👊", "🌿 Here we <b>don't track weight</b> — that's the protocol. We watch your energy, your sleep, and the fact that you keep coming back. And you do. 👊"],
    "cyc.compare": ["🔄 Tes cycles comparés", "🔄 Your cycles compared"],
    "cyc.cycle": ["Cycle", "Cycle"],

    /* ─ Profil ─ */
    "pf.title": ["Ton <em>profil</em>", "Your <em>profile</em>"],
    "pf.week": ["Semaine", "Week"],
    "pf.ofjourney": ["de ton parcours · mémorisé sur ton téléphone", "of your journey · saved on your phone"],
    "pf.redo": ["↺ Refaire le bilan", "↺ Redo assessment"],
    "pf.redo.confirm": ["Refaire le bilan ? Ton historique est conservé, mais le cycle repart à la semaine 1.", "Redo assessment? Your history is kept, but the cycle restarts at week 1."],
    "pf.footer": ["⚠️ Douleur = stop + professionnel de santé.<br>Pré-programmes à valider par le coach · pas un avis médical.", "⚠️ Pain = stop + healthcare professional.<br>Draft programs to validate with the coach · not medical advice."],
    "lang.label": ["Langue", "Language"],

    /* ─ Nutrition ─ */
    "nu.title": ["Côté <em>assiette</em>", "Your <em>nutrition</em>"],
    "nu.intro": ["Avant de parler nutrition, 4 questions. Réponds franchement — il n'y a pas de bonne réponse.", "Before we talk nutrition, 4 questions. Answer honestly — there's no right answer."],
    "nu.q.vitesse": ["Tu cherches à perdre du poids rapidement ?", "Are you trying to lose weight fast?"],
    "nu.q.balance": ["Tu te pèses à quelle fréquence ?", "How often do you weigh yourself?"],
    "nu.q.culpa": ["Il t'arrive de culpabiliser après avoir mangé ?", "Do you feel guilty after eating?"],
    "nu.q.tca": ["As-tu déjà eu un trouble du comportement alimentaire ?", "Have you ever had an eating disorder?"],
    "nu.v.non": ["Non", "No"],
    "nu.v.progr": ["Progressivement", "Gradually"],
    "nu.v.fast": ["Oui, le plus vite possible", "Yes, as fast as possible"],
    "nu.v.rare": ["Rarement", "Rarely"],
    "nu.v.week": ["1×/semaine", "Once a week"],
    "nu.v.daily": ["Tous les jours ou plus", "Daily or more"],
    "nu.v.never": ["Jamais", "Never"],
    "nu.v.sometimes": ["Parfois", "Sometimes"],
    "nu.v.often": ["Souvent", "Often"],
    "nu.v.yes": ["Oui", "Yes"],
    "nu.v.rather": ["Je préfère ne pas répondre", "I'd rather not say"],
    "nu.coach": ["Le coach", "The coach"],
    "nu.blocked": ["Je ne vais pas te donner de chiffres — ni calories, ni grammes.<br><br>Ce n'est pas une punition. C'est que, dans ta situation, compter risque de te faire plus de mal que de bien. Et mon rôle, c'est que tu ailles mieux.<br><br>On travaille autrement : sur <b style=\"color:var(--gold)\">ce que tu mets dans l'assiette</b>, pas sur combien ça pèse.", "I won't give you numbers — no calories, no grams.<br><br>It's not a punishment. In your situation, counting could do more harm than good. My job is for you to feel better.<br><br>We'll work differently: on <b style=\"color:var(--gold)\">what goes on your plate</b>, not how much it weighs."],
    "nu.plate": ["La méthode de l'assiette", "The plate method"],
    "nu.p1": ["Une source de protéines", "A protein source"],
    "nu.p1d": ["À chaque repas.", "At every meal."],
    "nu.p2": ["La moitié en légumes", "Half the plate veggies"],
    "nu.p2d": ["Volume, fibres, satiété.", "Volume, fibre, fullness."],
    "nu.p3": ["Des glucides", "Some carbs"],
    "nu.p3d": ["À ta faim, pas à un chiffre.", "To your appetite, not a number."],
    "nu.p4": ["Un peu de bon gras", "A little good fat"],
    "nu.p4d": ["Huile d'olive, avocat, oléagineux.", "Olive oil, avocado, nuts."],
    "nu.p5": ["De l'eau", "Water"],
    "nu.p5d": ["Toute la journée.", "All day long."],
    "nu.energy": ["Le seul indicateur qu'on suit : <b>ton énergie</b>. Tu tiens tes séances ? Tu dors bien ? Tu te sens bien ? Pas la balance.", "The only thing we track: <b>your energy</b>. Are you hitting your sessions? Sleeping well? Feeling good? Not the scale."],
    "nu.help": ["Si l'alimentation est une source d'angoisse, en parler à un professionnel n'est pas un échec.<br>Moustapha peut t'aider à trouver la bonne personne.", "If food is a source of anxiety, talking to a professional isn't a failure.<br>Moustapha can help you find the right person."],
    "nu.redo": ["↺ Refaire le questionnaire", "↺ Redo the questionnaire"],
    "nu.plan.t": ["🍽️ Ton plan sur mesure", "🍽️ Your tailored plan"],
    "nu.plan.d": ["Pour un vrai plan bâti <b style=\"color:var(--ink)\">à partir de ce que tu manges déjà</b> (tes plats, tes horaires, ton budget), c'est Moustapha qui te le construit — il connaît ta situation mieux qu'une formule.", "For a real plan built <b style=\"color:var(--ink)\">from what you already eat</b> (your meals, schedule, budget), Moustapha builds it — he knows your situation better than a formula."],
    "nu.timing": ["🥤 <b>Autour de l'entraînement :</b> des glucides avant pour l'énergie, des protéines + glucides après pour récupérer.", "🥤 <b>Around training:</b> carbs before for energy, protein + carbs after to recover."],
    "nu.footer": ["Repères généraux · pas un avis diététique · à personnaliser avec le coach", "General guidance · not dietary advice · personalize with the coach"],

    /* ─ Modales phase / exercice ─ */
    "ph.goal": ["🎯 L'objectif", "🎯 The goal"],
    "ph.why": ["💡 Pourquoi cette phase", "💡 Why this phase"],
    "ph.how": ["🏋️ Comment l'aborder", "🏋️ How to approach it"],
    "ex.primary": ["Muscles principaux", "Primary muscles"],
    "ex.secondary": ["Muscles secondaires", "Secondary muscles"],
    "ex.equip": ["Matériel", "Equipment"],
    "ex.tempo": ["Tempo", "Tempo"],
    "ex.rest": ["Repos", "Rest"],
    "ex.start": ["▶️ Position de départ", "▶️ Starting position"],
    "ex.end": ["⏹️ Position d'arrivée", "⏹️ End position"],
    "ex.cues": ["✅ Points techniques", "✅ Technique cues"],
    "ex.errors": ["❌ Erreurs fréquentes", "❌ Common mistakes"],
    "ex.variants": ["📊 Variantes par niveau", "📊 Variations by level"],
    "ex.beg": ["Débutant", "Beginner"],
    "ex.int": ["Intermédiaire", "Intermediate"],
    "ex.adv": ["Avancé", "Advanced"],
    "ex.alt": ["🔄 Sans matériel / alternatives", "🔄 No equipment / alternatives"],
    "ex.nofiche": ["La fiche détaillée de cet exercice n'est pas encore rédigée.<br><br>En attendant : technique propre, amplitude complète, charge maîtrisée. Une douleur = stop.<br><br>Demande à Moustapha pour les points techniques précis.", "The detailed sheet for this exercise isn't written yet.<br><br>In the meantime: clean technique, full range, controlled load. Pain = stop.<br><br>Ask Moustapha for the precise technique cues."],
    "ex.footer": ["Une douleur (pas une courbature) = arrêt + professionnel de santé.<br>Photos/vidéos : à venir avec les tournages de Moustapha.", "Pain (not soreness) = stop + healthcare professional.<br>Photos/videos: coming with Moustapha's filming."],

    /* ─ Sélecteur de semaine ─ */
    "wk.title": ["Où en es-tu ?", "Where are you?"],
    "wk.sub": ["L'app suit tes semaines automatiquement. Mais si tu as commencé avant, ou sauté une semaine, ajuste ici.", "The app tracks your weeks automatically. But if you started earlier, or skipped a week, adjust here."],
    "wk.week": ["SEMAINE", "WEEK"],

    /* ─ Messages intelligents du coach (accueil) — {x} = variables ─ */
    "cm.pain": ["{0}, une douleur n'est pas un détail. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé — et préviens Moustapha, il adaptera.", "{0}, pain isn't a detail. You don't train through it. If it lasts: healthcare professional — and tell Moustapha, he'll adapt."],
    "cm.deload": ["Cette semaine est légère — c'est le programme, pas une erreur. C'est pendant la récupération que le corps construit. Ne rajoute rien.", "This week is light — it's the plan, not a mistake. The body builds during recovery. Don't add anything."],
    "cm.absence": ["{0} jours sans séance. Aucune culpabilité — ça arrive à tout le monde. On repart PLUS PETIT, pas en rattrapant : une séance courte aujourd'hui vaut mieux qu'une séance parfaite jamais faite.", "{0} days without a session. No guilt — it happens to everyone. We restart SMALLER, not by catching up: a short session today beats a perfect one never done."],
    "cm.stagne": ["{0} : la charge ne bouge plus depuis 3 séances. Avant de forcer, vérifie le sommeil et l'assiette. Si ça continue → une semaine légère, puis on repart −10 %. C'est comme ça qu'on débloque.", "{0}: the load hasn't moved in 3 sessions. Before forcing it, check your sleep and your plate. If it continues → a light week, then restart −10%. That's how you break through."],
    "cm.progress": ["+{0} kg sur {1} depuis le début. C'est ça, la vraie progression — pas la balance. Continue. 👊", "+{0} kg on {1} since the start. That's real progress — not the scale. Keep going. 👊"],
    "cm.weekgoal": ["{0}/{1} séances cette semaine — objectif atteint. La régularité, c'est LE truc que la plupart des gens n'ont pas. Toi, tu l'as.", "{0}/{1} sessions this week — goal reached. Consistency is THE thing most people lack. You have it."],
    "cm.phase": ["Nouvelle semaine, nouvelle phase : {0}. {1}", "New week, new phase: {0}. {1}"],

    /* ─ Chips coach ─ */
    "chip.warmup": ["Échauffement ?", "Warm-up?"],
    "chip.sore": ["Courbatures ?", "Sore muscles?"],
    "chip.rpe": ["C'est quoi le RPE ?", "What's RPE?"],
    "chip.motiv": ["Pas motivé", "Not motivated"],
    "chip.deload": ["C'est quoi le deload ?", "What's a deload?"],
  };
  window.tf = (key, ...args) => {
    let s = window.t(key);
    args.forEach((a, i) => { s = s.split("{" + i + "}").join(a); });
    return s;
  };

  window.t = (key) => {
    const e = T[key];
    if (!e) return key;
    return e[window.LANG === "en" ? 1 : 0];
  };
  /* alias globaux directs (au cas où le contexte n'expose pas window.* comme globals) */
  try { t = window.t; tf = window.tf; } catch (e) {}
})();
