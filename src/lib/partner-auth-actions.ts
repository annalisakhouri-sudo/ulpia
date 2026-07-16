"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function partnerLogin(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect(`/partenaire/connexion?erreur=${encodeURIComponent("Email ou mot de passe incorrect.")}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    redirect(
      `/partenaire/connexion?erreur=${encodeURIComponent(
        "Impossible de contacter le serveur. Réessaie dans un instant."
      )}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/partenaire/tableau-de-bord");
}

export async function partnerSignup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const fullName = String(formData.get("fullName"));

  try {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: "interlocutor",
          full_name: fullName,
        },
      },
    });

    if (error) {
      const message =
        typeof error.message === "string" && error.message.length > 0
          ? error.message
          : "Une erreur est survenue. Vérifie tes informations et réessaie.";
      redirect(`/partenaire/inscription?erreur=${encodeURIComponent(message)}`);
    }

    if (!data?.session) {
      redirect(
        `/partenaire/connexion?erreur=${encodeURIComponent(
          "Compte créé ! Vérifiez votre email pour confirmer votre adresse avant de vous connecter."
        )}`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    redirect(
      `/partenaire/inscription?erreur=${encodeURIComponent(
        "Impossible de contacter le serveur. Réessaie dans un instant."
      )}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/partenaire/tableau-de-bord");
}

export async function partnerLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/partenaire/connexion");
}
