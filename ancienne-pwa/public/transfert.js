/* ═══════════════════════════════════════════════
   PT MOUSS IA — Transfert vers la nouvelle plateforme
   Emballe le profil, l'historique des séances et les check-ins
   stockés sur CE téléphone, puis ouvre la plateforme qui les importe.
   Les données voyagent dans le #fragment de l'adresse : il n'est
   jamais envoyé à un serveur par le navigateur.
   (dépend de app.js : S)
   ═══════════════════════════════════════════════ */

const PLATEFORME = "https://ptmouss-plateforme.vercel.app/importer";

function b64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function emballer() {
  const checkins = {};
  Object.entries(S.daily || {}).forEach(([jour, d]) => { if (d && d.checkin) checkins[jour] = d.checkin; });
  const paquet = { v: 1, exporte_le: new Date().toISOString(), profile: S.profile, history: S.history || [], checkins };
  const brut = new TextEncoder().encode(JSON.stringify(paquet));
  /* Compression gzip quand le navigateur sait le faire (iOS 16.4+, Android récent) */
  if (window.CompressionStream) {
    const flux = new Blob([brut]).stream().pipeThrough(new CompressionStream("gzip"));
    const gz = new Uint8Array(await new Response(flux).arrayBuffer());
    return "z" + b64url(gz);
  }
  return "j" + b64url(brut);
}

window.transfererVersPlateforme = async function () {
  if (!S.profile && !(S.history || []).length) { alert("Rien à transférer : fais d'abord ton bilan."); return; }
  const btn = document.getElementById("btnTransfert");
  if (btn) { btn.disabled = true; btn.textContent = "Préparation…"; }
  try {
    const code = await emballer();
    window.location.href = PLATEFORME + "#d=" + code;
  } catch (e) {
    alert("Le transfert n'a pas pu être préparé sur ce téléphone. Écris à Moustapha.");
    if (btn) { btn.disabled = false; btn.textContent = "Transférer mon historique"; }
  }
};

window.transfertCard = function () {
  const n = (S.history || []).length;
  return `<div class="card gold glow anim-item" style="margin-top:14px">
    <div style="font-family:Oswald;font-weight:700;font-size:16px;text-transform:uppercase">Nouvelle appli PT Mouss</div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.6;margin:8px 0 12px">
      Une nouvelle version arrive, avec ton compte : tes séances ne seront plus jamais perdues, même si tu changes de téléphone.
      Transfère ton bilan et tes <b style="color:var(--ink)">${n} séance${n > 1 ? "s" : ""}</b> en un geste.</div>
    <button class="btn p" id="btnTransfert" onclick="transfererVersPlateforme()">Transférer mon historique</button>
  </div>`;
};

/* Chargé après bilan.js, qui a déjà dessiné l'écran : on redessine pour afficher la carte */
if (typeof render === "function") render();
