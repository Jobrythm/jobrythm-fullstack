import { apiClient } from './client';
import type {
  AdConnectionsResponse,
  AdCampaign,
  AdCreative,
  AdPlatformSettings,
} from '../types';

// ── Platform connections ───────────────────────────────────────────────────────

export const adsGetConnections = async (): Promise<AdConnectionsResponse> => {
  const { data } = await apiClient.get<AdConnectionsResponse>('/admin/ads/connections');
  return data;
};

export const adsGetAuthUrl = (platform: 'google' | 'youtube' | 'meta'): string => {
  const base = apiClient.defaults.baseURL ?? '/api';
  return `${base}/admin/ads/auth/${platform}`;
};

export const adsDisconnect = async (platform: string): Promise<void> => {
  await apiClient.delete(`/admin/ads/connections/${platform}`);
};

// ── Ad campaigns ───────────────────────────────────────────────────────────────

export interface AdCampaignPayload {
  platform: AdCampaign['platform'];
  name: string;
  budgetCents?: number;
  startDate?: string;
  endDate?: string;
}

export const adsGetCampaigns = async (): Promise<AdCampaign[]> => {
  const { data } = await apiClient.get<AdCampaign[]>('/admin/ads/campaigns');
  return data;
};

export const adsCreateCampaign = async (payload: AdCampaignPayload): Promise<AdCampaign> => {
  const { data } = await apiClient.post<AdCampaign>('/admin/ads/campaigns', payload);
  return data;
};

export const adsSyncCampaigns = async (): Promise<{ synced: number; errors: string[] }> => {
  const { data } = await apiClient.post<{ synced: number; errors: string[] }>('/admin/ads/campaigns/sync', {});
  return data;
};

// ── Ad creatives ───────────────────────────────────────────────────────────────

export interface AdCreativePayload {
  platform: AdCreative['platform'];
  type: AdCreative['type'];
  title: string;
  body?: string;
  mediaUrl?: string;
}

export const adsGetCreatives = async (): Promise<AdCreative[]> => {
  const { data } = await apiClient.get<AdCreative[]>('/admin/ads/creatives');
  return data;
};

export const adsCreateCreative = async (payload: AdCreativePayload): Promise<AdCreative> => {
  const { data } = await apiClient.post<AdCreative>('/admin/ads/creatives', payload);
  return data;
};

export const adsDeleteCreative = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/ads/creatives/${id}`);
};

// ── Ad platform settings ───────────────────────────────────────────────────────

export interface AdPlatformSettingsPayload {
  googleClientId?: string;
  googleClientSecret?: string;
  googleDeveloperToken?: string;
  metaAppId?: string;
  metaAppSecret?: string;
}

export const adsGetSettings = async (): Promise<AdPlatformSettings> => {
  const { data } = await apiClient.get<AdPlatformSettings>('/admin/ads/settings');
  return data;
};

export const adsUpdateSettings = async (payload: AdPlatformSettingsPayload): Promise<AdPlatformSettings> => {
  const { data } = await apiClient.put<AdPlatformSettings>('/admin/ads/settings', payload);
  return data;
};
