"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const ShopContext = createContext({
  user: null,
  role: null,
  queryId: null,
  loading: true,
});

export const ShopProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [queryId, setQueryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchContext = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        if (isMounted) setLoading(false);
        return;
      }
      
      setUser(currentUser);

      const { data: dbUser } = await supabase
        .from('users')
        .select('role, owner_id')
        .eq('id', currentUser.id)
        .single();
      
      if (isMounted) {
        if (dbUser?.role === 'shop_attendant' && dbUser.owner_id) {
          setRole('shop_attendant');
          setQueryId(dbUser.owner_id);
        } else {
          setRole(dbUser?.role || 'shop_owner');
          setQueryId(currentUser.id);
        }
        setLoading(false);
      }
    };

    fetchContext();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setQueryId(null);
        } else if (event === 'SIGNED_IN') {
          fetchContext();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <ShopContext.Provider value={{ user, role, queryId, loading }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
