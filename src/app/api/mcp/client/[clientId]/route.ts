import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Get MCP Client Info
 *
 * GET /api/mcp/client/[clientId]
 */
export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    if (!clientId) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );

    const { data, error } = await supabase
      .from('mcp_clients')
      .select('id, client_id, name, description, logo_url, scopes')
      .eq('client_id', clientId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get client info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
