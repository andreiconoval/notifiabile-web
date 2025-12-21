/**
 * Supabase Database Migration for MCP Authentication
 * 
 * Run this in your Supabase SQL editor to create the necessary tables
 */

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MCP Clients Table
-- Stores registered MCP client applications
CREATE TABLE IF NOT EXISTS mcp_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT client_id_length CHECK (LENGTH(client_id) >= 10),
  CONSTRAINT client_secret_length CHECK (LENGTH(client_secret) >= 32)
);

-- Create index on client_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_mcp_clients_client_id ON mcp_clients(client_id);

-- MCP Authorizations Table
-- Stores authorization codes issued to users
CREATE TABLE IF NOT EXISTS mcp_authorizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(255) NOT NULL REFERENCES mcp_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  authorization_code VARCHAR(255) UNIQUE NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes on mcp_authorizations
CREATE INDEX IF NOT EXISTS idx_mcp_authorizations_client_id ON mcp_authorizations(client_id);
CREATE INDEX IF NOT EXISTS idx_mcp_authorizations_user_id ON mcp_authorizations(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_authorizations_code ON mcp_authorizations(authorization_code);
CREATE INDEX IF NOT EXISTS idx_mcp_authorizations_expires_at ON mcp_authorizations(expires_at);

-- MCP Refresh Tokens Table
-- Stores refresh tokens for MCP clients
CREATE TABLE IF NOT EXISTS mcp_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(255) NOT NULL REFERENCES mcp_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes on mcp_refresh_tokens
CREATE INDEX IF NOT EXISTS idx_mcp_refresh_tokens_client_id ON mcp_refresh_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_mcp_refresh_tokens_user_id ON mcp_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_refresh_tokens_token_hash ON mcp_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_mcp_refresh_tokens_expires_at ON mcp_refresh_tokens(expires_at);

-- MCP Access Logs Table (optional, for auditing)
-- Tracks all MCP client access
CREATE TABLE IF NOT EXISTS mcp_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES mcp_clients(client_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on mcp_access_logs for queries
CREATE INDEX IF NOT EXISTS idx_mcp_access_logs_client_user ON mcp_access_logs(client_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_access_logs_created_at ON mcp_access_logs(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE mcp_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see their own authorizations
CREATE POLICY "Users can view their own MCP authorizations"
  ON mcp_authorizations FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to see their own refresh tokens
CREATE POLICY "Users can view their own MCP refresh tokens"
  ON mcp_refresh_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to see their own access logs
CREATE POLICY "Users can view their own MCP access logs"
  ON mcp_access_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Functions for cleanup

-- Function to clean up expired authorizations
CREATE OR REPLACE FUNCTION cleanup_expired_mcp_authorizations()
RETURNS void AS $$
BEGIN
  DELETE FROM mcp_authorizations
  WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_mcp_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM mcp_refresh_tokens
  WHERE (expires_at < NOW() OR revoked_at IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's MCP clients
CREATE OR REPLACE FUNCTION get_user_mcp_clients(user_id UUID)
RETURNS TABLE (
  client_id VARCHAR,
  name VARCHAR,
  last_used TIMESTAMP WITH TIME ZONE,
  authorization_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.client_id,
    mc.name,
    MAX(mal.created_at) as last_used,
    COUNT(ma.id) as authorization_count
  FROM mcp_clients mc
  LEFT JOIN mcp_authorizations ma ON mc.client_id = ma.client_id AND ma.user_id = user_id
  LEFT JOIN mcp_access_logs mal ON mc.client_id = mal.client_id AND mal.user_id = user_id
  WHERE ma.user_id = user_id OR mal.user_id = user_id
  GROUP BY mc.client_id, mc.name;
END;
$$ LANGUAGE plpgsql;
