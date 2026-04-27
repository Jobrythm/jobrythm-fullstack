import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adsGetConnections,
  adsDisconnect,
  adsGetCampaigns,
  adsCreateCampaign,
  adsSyncCampaigns,
  adsGetCreatives,
  adsCreateCreative,
  adsDeleteCreative,
  adsGetSettings,
  adsUpdateSettings,
} from '../../../api/ads';
import type { AdCampaignPayload, AdCreativePayload, AdPlatformSettingsPayload } from '../../../api/ads';

export const adsConnectionsQueryKey = ['admin', 'ads', 'connections'] as const;
export const adsCampaignsQueryKey   = ['admin', 'ads', 'campaigns']   as const;
export const adsCreativesQueryKey   = ['admin', 'ads', 'creatives']   as const;
export const adsSettingsQueryKey    = ['admin', 'ads', 'settings']    as const;

export const useAdsConnections = () =>
  useQuery({ queryKey: adsConnectionsQueryKey, queryFn: adsGetConnections });

export const useAdsDisconnect = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) => adsDisconnect(platform),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adsConnectionsQueryKey }),
  });
};

export const useAdsCampaigns = () =>
  useQuery({ queryKey: adsCampaignsQueryKey, queryFn: adsGetCampaigns });

export const useCreateAdCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdCampaignPayload) => adsCreateCampaign(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adsCampaignsQueryKey }),
  });
};

export const useSyncAdCampaigns = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adsSyncCampaigns(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adsCampaignsQueryKey }),
  });
};

export const useAdsCreatives = () =>
  useQuery({ queryKey: adsCreativesQueryKey, queryFn: adsGetCreatives });

export const useCreateAdCreative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdCreativePayload) => adsCreateCreative(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adsCreativesQueryKey }),
  });
};

export const useDeleteAdCreative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adsDeleteCreative(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adsCreativesQueryKey }),
  });
};

export const useAdsSettings = () =>
  useQuery({ queryKey: adsSettingsQueryKey, queryFn: adsGetSettings });

export const useUpdateAdsSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdPlatformSettingsPayload) => adsUpdateSettings(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adsSettingsQueryKey }),
  });
};
