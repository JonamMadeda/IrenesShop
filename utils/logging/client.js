import { getShopContext } from "@/utils/supabase/getShopContext";

export async function logSystemEvent({
  supabase,
  shopId,
  action,
  entityType,
  entityId = null,
  entityName = null,
  details = {},
  actorRole = null,
}) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !shopId) {
      return;
    }

    const resolvedContext = actorRole ? { role: actorRole } : await getShopContext(user.id);

    const payload = {
      shop_id: shopId,
      actor_user_id: user.id,
      actor_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email ||
        "Unknown User",
      actor_email: user.email,
      actor_role: resolvedContext?.role || actorRole || "shop_attendant",
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      entity_name: entityName,
      details,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("system_logs").insert(payload);

    if (error) {
      console.warn("System log insert skipped:", error.message || error);
    }
  } catch (error) {
    console.warn("System log insert failed:", error?.message || error);
  }
}
