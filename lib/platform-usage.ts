// Only section names cross the analytics boundary; never URLs, IDs or labels.
export const USAGE_SECTIONS = ['dashboard','learning','training','career','reinforcements','competencies','certificates','community','mentoring','employment','practice','teams','profile','support','news','notifications','portfolio','modules','billing','administration'] as const;
export type UsageSection = typeof USAGE_SECTIONS[number];
export function usageSection(path: string): UsageSection | null {
  const root = path.split('?')[0].split('#')[0].split('/').filter(Boolean);
  const key = root[0];
  if (key === 'portfolio' && root[1] === 'share') return null;
  if (key === 'positions' || key === 'customer-success' || key === 'weekly-cases') return 'training';
  if (key === 'role-training') return root[1] === 'career-map' ? 'career' : root[1] === 'reinforcements' ? 'reinforcements' : 'training';
  const sections: Record<string, UsageSection> = {dashboard:'dashboard',learn:'learning',competencies:'competencies',certificates:'certificates',certificate:'certificates',diplomas:'certificates',community:'community',mentoring:'mentoring','employment-kit':'employment',practice:'practice',teams:'teams',profile:'profile',help:'support',news:'news',notifications:'notifications',portfolio:'portfolio',modules:'modules',checkout:'billing',admin:'administration'};
  return sections[key] ?? null;
}
export function validUsageBatch(input: unknown): input is {id:string;section:UsageSection;clicks:number;visits:number} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const x = input as Record<string,unknown>;
  return Object.keys(x).length === 4 && typeof x.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x.id)
    && typeof x.section === 'string' && (USAGE_SECTIONS as readonly string[]).includes(x.section)
    && Number.isInteger(x.clicks) && Number(x.clicks) >= 0 && Number(x.clicks) <= 200
    && Number.isInteger(x.visits) && Number(x.visits) >= 0 && Number(x.visits) <= 1 && Number(x.clicks) + Number(x.visits) > 0;
}
