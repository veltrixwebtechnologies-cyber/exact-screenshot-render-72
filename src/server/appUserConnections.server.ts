import { decryptConnectionKey, encryptConnectionKey } from "./connectionKeyCrypto";

export async function saveConnectionKeyForUser(
  userId: string,
  connectorId: string,
  connectionAPIKey: string,
  externalUsername?: string | null,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any).from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: connectorId,
      connection_key_ciphertext: encryptConnectionKey(connectionAPIKey),
      external_username: externalUsername ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function setExternalUsername(
  userId: string,
  connectorId: string,
  externalUsername: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await (supabaseAdmin as any)
    .from("app_user_connections")
    .update({ external_username: externalUsername })
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
}

export async function getConnectionForUser(userId: string, connectorId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any)
    .from("app_user_connections")
    .select("connection_key_ciphertext, external_username, updated_at")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    connectionAPIKey: decryptConnectionKey(data.connection_key_ciphertext as string),
    externalUsername: (data.external_username as string | null) ?? null,
    updatedAt: data.updated_at as string,
  };
}

export async function deleteConnectionForUser(userId: string, connectorId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await (supabaseAdmin as any)
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
}
