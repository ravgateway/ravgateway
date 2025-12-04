// src/hooks/useAdminAuth.ts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Admin emails whitelist
const ADMIN_EMAILS = [
  'ravgateway@gmail.com',
  'marvellouskayode17@gmail.com',
  // Add more admin emails here
];

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const userEmail = session.user.email?.toLowerCase();
      const isAdminUser = ADMIN_EMAILS.includes(userEmail || "");

      if (!isAdminUser) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Admin auth error:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
};