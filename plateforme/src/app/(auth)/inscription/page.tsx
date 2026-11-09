import { FormAuth } from "@/components/FormAuth";

export const metadata = { title: "Inscription — PT Mouss IA" };

export default function Page() {
  return (
    <>
      <FormAuth mode="inscription" />
      <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, textAlign: "center" }}>
        Tes données d'entraînement sont visibles par toi et par ton coach, Moustapha. Elles ne sont jamais partagées.
      </p>
    </>
  );
}
