import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nikjujkffuinhhrmecnh.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pa2p1amtmZnVpbmhocm1lY25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODA3NTksImV4cCI6MjA5NjI1Njc1OX0.oeWHakPmszYEr7gHunWQ49sGN2rfKsEeaDc3je52ms4";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);