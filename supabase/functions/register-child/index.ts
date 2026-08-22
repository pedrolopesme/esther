import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_DOMAIN = "esther.internal";

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método não permitido." });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { ok: false, error: "Não autenticado." });
  }

  // Use caller's JWT to verify parent role
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user: parentUser }, error: authError } =
    await supabaseClient.auth.getUser();
  if (authError || !parentUser) {
    return jsonResponse(401, { ok: false, error: "Sessão inválida." });
  }

  // Verify parent role
  const { data: parentProfile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", parentUser.id)
    .single();

  if (parentProfile?.role !== "parent") {
    return jsonResponse(403, {
      ok: false,
      error: "Apenas responsáveis podem cadastrar filhos.",
    });
  }

  // Parse body
  let body: { display_name?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { ok: false, error: "Corpo inválido." });
  }

  const { display_name, username, password } = body;

  if (!display_name?.trim() || !username?.trim() || !password) {
    return jsonResponse(400, {
      ok: false,
      error: "Nome, usuário e senha são obrigatórios.",
    });
  }

  const safeUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(safeUsername)) {
    return jsonResponse(400, {
      ok: false,
      error: "Usuário deve ter 3 a 30 caracteres: letras, números e _.",
    });
  }

  if (password.length < 6) {
    return jsonResponse(400, {
      ok: false,
      error: "A senha precisa ter pelo menos 6 caracteres.",
    });
  }

  const email = `${safeUsername}@${INTERNAL_DOMAIN}`;

  // Admin client to create user (bypasses email confirmation)
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Create the auth user
  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: display_name.trim(), role: "student" },
    });

  if (createError) {
    if (createError.message?.includes("duplicate")) {
      return jsonResponse(409, {
        ok: false,
        error: "Este nome de usuário já está em uso.",
      });
    }
    return jsonResponse(500, { ok: false, error: createError.message });
  }

  const childId = newUser.user.id;

  // Profile is created by handle_new_user trigger — verify it exists
  // Then create the parent_children link
  const { error: linkError } = await adminClient
    .from("parent_children")
    .insert({ parent_id: parentUser.id, child_id: childId });

  if (linkError) {
    // Rollback: delete the created user
    await adminClient.auth.admin.deleteUser(childId);
    return jsonResponse(500, { ok: false, error: linkError.message });
  }

  return jsonResponse(200, {
    ok: true,
    child_id: childId,
    display_name: display_name.trim(),
    username: safeUsername,
  });
});

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}