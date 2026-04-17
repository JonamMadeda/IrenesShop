"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
      } else {
        window.location.href = "/dashboard";
      }
    };
    checkUser();
  }, [supabase]);

  return (
    <main className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600 font-serif">
          Redirecting...
        </p>
      </div>
    </main>
  );
}
