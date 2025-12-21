// 'use client';

// import { useMemo } from 'react';
// import { useGetMultiLookupValuesEndpoint } from '@/api/generated/teammate.web';
// import {
//   LookupValueDto,
//   LookupCategoryCode,
//   GetMultiLookupValuesEndpoint200, // adjust path/name if needed
// } from '@/api/generated/schemas';

// type LookupMap = Partial<Record<keyof typeof LookupCategoryCode | string, LookupValueDto[]>>;

// /**
//  * Hook to consume cached lookups anywhere in the app.
//  * It uses the SAME params/key as the bootstrap so it hits the cache.
//  */
// export function useLookups() {
//   const params = {
//     categories: [LookupCategoryCode.SPORTS, LookupCategoryCode.SKILL_LEVEL],
//     onlyActive: true,
//     locale: undefined,
//   };

//   const { data, isLoading, error } = useGetMultiLookupValuesEndpoint(params, {
//     query: {
//       staleTime: 24 * 60 * 60 * 1000,
//       gcTime: 24 * 60 * 60 * 1000,
//       // do NOT refetch here; rely on bootstrap’s fetch
//       // but if user navigates directly to a deep page, this still fetches once.
//       placeholderData: (prev) => prev as any,
//     },
//   });

//   // ---- Map the response to a dictionary ----
//   // Many APIs return: { SPORTS: LookupValueDto[], SKILL_LEVEL: LookupValueDto[] }
//   // If yours returns another shape, adapt the mapping here.
//   const map = useMemo<LookupMap>(() => {
//     const raw = (data as unknown as GetMultiLookupValuesEndpoint200) ?? {};
//     // If already a record of arrays, just return:
//     return raw as unknown as LookupMap;
//   }, [data]);

//   const sports = (map.SPORTS ?? []).sort(byOrderThenName);
//   const skillLevels = (map.SKILL_LEVEL ?? []).sort(byOrderThenName);

//   const sportsById = useMemo<Record<string, LookupValueDto>>(
//     () =>
//       Object.fromEntries(
//         sports
//           .filter((x): x is LookupValueDto & { id: string } => typeof x.id === 'string')
//           .map((x) => [x.id, x]),
//       ),
//     [sports],
//   );

//   const skillById = useMemo<Record<string, LookupValueDto>>(
//     () =>
//       Object.fromEntries(
//         skillLevels
//           .filter((x): x is LookupValueDto & { id: string } => typeof x.id === 'string')
//           .map((x) => [x.id, x]),
//       ),
//     [skillLevels],
//   );

//   // 🔎 Helpers (by id)
//   const getSportById = (id?: string | null) => (id ? sportsById[id] : undefined);
//   const getSportNameById = (id?: string | null) => getSportById(id)?.name;

//   const getSkillLevelById = (id?: string | null) => (id ? skillById[id] : undefined);
//   const getSkillLevelNameById = (id?: string | null) => getSkillLevelById(id)?.name;

//   return {
//     isLoading,
//     error,
//     sports,
//     skillLevels,
//     raw: map,
//     getSportById,
//     getSportNameById,
//     getSkillLevelById,
//     getSkillLevelNameById,
//   };
// }

// function byOrderThenName(a: LookupValueDto, b: LookupValueDto) {
//   const ao = a.order ?? 0;
//   const bo = b.order ?? 0;
//   if (ao !== bo) return ao - bo;
//   return (a.name ?? '').localeCompare(b.name ?? '');
// }
