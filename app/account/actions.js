"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function getAttendants() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return []; // Return empty if not authorized instead of throwing to prevent 500
    }

    // Use a simpler query first to avoid potential column-name issues
    const { data, error } = await supabase
      .from("users")
      .select("id, role, owner_id, updated_at")
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error fetching attendants:", error);
      return []; 
    }

    return data || [];
  } catch (err) {
    console.error("Server Action Exception [getAttendants]:", err);
    return [];
  }
}

export async function createAttendantUser({ email, password, name }) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user: owner } } = await supabase.auth.getUser();

  if (!owner) {
    throw new Error("Unauthorized");
  }

  // 1. Create the auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
      full_name: name,
    },
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    throw authError;
  }

  const newUser = authData.user;

  // 2. Link in public users table
  const { error: dbError } = await adminClient.from("users").upsert({
    id: newUser.id,
    role: "shop_attendant",
    display_name: name,
    owner_id: owner.id,
    updated_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error("Error linking public user:", dbError);
    // Cleanup auth user if db sync fails
    await adminClient.auth.admin.deleteUser(newUser.id);
    throw dbError;
  }

  return { success: true, user: newUser };
}

export async function deleteAttendantUser(userId) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user: owner } } = await supabase.auth.getUser();

  if (!owner) {
    throw new Error("Unauthorized");
  }

  // Verify ownership before deleting
  const { data: attendant, error: fetchError } = await supabase
    .from("users")
    .select("owner_id")
    .eq("id", userId)
    .single();

  if (fetchError || !attendant || attendant.owner_id !== owner.id) {
    throw new Error("Permission denied or user not found");
  }

  // Delete from Auth (cascades or triggers usually handle public table, 
  // but we can be explicit if needed)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("Error deleting attendant:", deleteError);
    throw deleteError;
  }

  return { success: true };
}
