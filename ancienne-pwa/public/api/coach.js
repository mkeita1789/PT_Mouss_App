/* ═══ PT MOUSS IA — Fonction coach (OPTIONNELLE) ═══
   Pour activer le chat coach IA dans l'app :
   1. Sur Vercel : Settings → Environment Variables → ajouter ANTHROPIC_API_KEY
      (clé créée sur console.anthropic.com — usage payant à l'utilisation)
   2. Redéployer. C'est tout.
   Sans cette clé, l'app fonctionne à 100 % — juste sans le chat. */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST uniquement" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "Coach IA non configuré (pas de clé API)." });

  try {
    const { messages, profile } = req.body || {};
    const system = `Tu es le coach personnel JIGI de ${profile?.prenom || "ton client"}.
Style : direct, chaleureux, bref. Tutoiement. Jamais "je suis une IA".
Profil : ${JSON.stringify(profile || {})}
SÉCURITÉ (prime sur tout) :
- Douleur → aucun diagnostic, arrêt, professionnel de santé + en parler à Moustapha.
- Signaux de trouble alimentaire → AUCUN chiffre nutrition, douceur, orientation pro.
- Détresse → écouter d'abord, orienter.
- N'invente jamais un exercice ou une charge. En cas de doute → Moustapha.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
        system,
        messages: (messages || []).slice(-12),
      }),
    });
    const d = await r.json();
    const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    res.status(200).json({ text: text || "…" });
  } catch (e) {
    res.status(500).json({ error: "Erreur coach : " + e.message });
  }
}
