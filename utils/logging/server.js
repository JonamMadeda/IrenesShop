"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function logServerSystemEvent({
  actorUser,
  shopId,
  action,
  entityType,
  entityId = null,
  entityName = null,
  details = {},
  actorRole = null,
}) {
  try {
    if (!actorUser?.id || !shopId) {
      return;
    }

    const adminClient = createAdminClient();

    const payload = {
      shop_id: shopId,
      actor_user_id: actorUser.id,
      actor_name:
        actorUser.user_metadata?.display_name ||
        actorUser.user_metadata?.full_name ||
        actorUser.email ||
        "Unknown User",
      actor_email: actorUser.email,
      actor_role: actorRole || actorUser.user_metadata?.role || "shop_owner",
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      entity_name: entityName,
      details,
      created_at: new Date().toISOString(),
    };

    const { error } = await adminClient.from("system_logs").insert(payload);

    if (error) {
      console.warn("Server system log insert skipped:", error.message || error);
    }
  } catch (error) {
    console.warn("Server system log insert failed:", error?.message || error);
  }
}
