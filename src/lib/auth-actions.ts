"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/connexion?erreur=${encodeURIComponent("Email ou mot de passe incorrect.")}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    redirect(
      `/connexion?erreur=${encodeURIComponent(
        "Impossible de contacter le serveur. Réessaie dans un instant."
      )}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const fullName = String(formData.get("fullName"));
  const companyName = String(formData.get("companyName"));

  try {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });

    if (error) {
      const message =
        typeof error.message === "string" && error.message.length > 0
          ? error.message
          : "Une erreur est survenue. Vérifie tes informations et réessaie.";
      redirect(`/inscription?erreur=${encodeURIComponent(message)}`);
    }

    // Si Supabase exige une confirmation par email, la session n'est pas encore active :
    // on prévient la personne plutôt que de la laisser croire qu'elle est connectée.
    if (!data?.session) {
      redirect(
        `/connexion?erreur=${encodeURIComponent(
          "Compte créé ! Vérifiez votre email pour confirmer votre adresse avant de vous connecter."
        )}`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    redirect(
      `/inscription?erreur=${encodeURIComponent(
        "Impossible de contacter le serveur. Réessaie dans un instant."
      )}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/connexion");
}
