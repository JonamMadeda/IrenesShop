"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { logServerSystemEvent } from "@/utils/logging/server";

export async function getAttendants() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, role, owner_id, display_name, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

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

export async function createAttendantUser({ email, password, name, role }) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user: owner },
  } = await supabase.auth.getUser();

  if (!owner) {
    throw new Error("Unauthorized");
  }

  const normalizedRole = role || "shop_attendant";

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
      full_name: name,
      role: normalizedRole,
    },
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    throw authError;
  }

  const newUser = authData.user;

  const { error: dbError } = await adminClient.from("users").upsert({
    id: newUser.id,
    role: normalizedRole,
    display_name: name,
    owner_id: owner.id,
    updated_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error("Error linking public user:", dbError);
    await adminClient.auth.admin.deleteUser(newUser.id);
    throw dbError;
  }

  await logServerSystemEvent({
    actorUser: owner,
    shopId: owner.id,
    action: "create",
    entityType: "attendant_account",
    entityId: newUser.id,
    entityName: name,
    actorRole: "shop_owner",
    details: {
      email,
      role: normalizedRole,
    },
  });

  return { success: true, user: newUser };
}

export async function deleteAttendantUser(userId) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user: owner },
  } = await supabase.auth.getUser();

  if (!owner) {
    throw new Error("Unauthorized");
  }

  const { data: attendant, error: fetchError } = await supabase
    .from("users")
    .select("owner_id, display_name, role")
    .eq("id", userId)
    .single();

  if (fetchError || !attendant || attendant.owner_id !== owner.id) {
    throw new Error("Permission denied or user not found");
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("Error deleting attendant:", deleteError);
    throw deleteError;
  }

  await logServerSystemEvent({
    actorUser: owner,
    shopId: owner.id,
    action: "delete",
    entityType: "attendant_account",
    entityId: userId,
    entityName: attendant.display_name || "Attendant",
    actorRole: "shop_owner",
    details: {
      role: attendant.role,
    },
  });

  return { success: true };
}
