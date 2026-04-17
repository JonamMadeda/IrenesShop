import { createClient } from './client';

/**
 * Resolves the query context for the current user.
 * - If the user is a shop_owner, it returns their own ID.
 * - If the user is a shop_attendant, it returns their owner's ID.
 * This ensures that attendants query and insert data into their owner's ledger.
 * 
 * @param {string} userId - The authed user's ID
 * @returns {Promise<{ queryId: string, role: string }>}
 */
export async function getShopContext(userId) {
  if (!userId) return { queryId: null, role: null };
  
  const supabase = createClient();
  const { data: dbUser, error } = await supabase
    .from('users')
    .select('role, owner_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn("Could not fetch user context:", error);
    return { queryId: userId, role: 'shop_owner' }; // safe fallback
  }

  if (dbUser?.role === 'shop_attendant' && dbUser.owner_id) {
    return { queryId: dbUser.owner_id, role: dbUser.role };
  }

  return { queryId: userId, role: dbUser?.role || 'shop_owner' };
}
