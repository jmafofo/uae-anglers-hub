import Link from 'next/link';
import { AlertTriangle, ShieldAlert, Ruler, ExternalLink, Ban } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Regulation {
  id: string;
  title: string;
  regulation_type: string;
  description: string | null;
  ban_start_month: number | null;
  ban_start_day: number | null;
  ban_end_month: number | null;
  ban_end_day: number | null;
  ban_scope: string | null;
  min_size_cm: number | null;
  min_weight_kg: number | null;
  authority: string | null;
  legal_ref: string | null;
  source_url: string | null;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatBanPeriod(reg: Regulation): string {
  if (!reg.ban_start_month || !reg.ban_end_month) return '';
  const start = `${MONTH_NAMES[reg.ban_start_month]} ${reg.ban_start_day ?? 1}`;
  const end = `${MONTH_NAMES[reg.ban_end_month]} ${reg.ban_end_day ?? 28}`;
  return `${start} – ${end}`;
}

function isBanActive(reg: Regulation): boolean {
  if (!reg.ban_start_month || !reg.ban_end_month) return false;
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const startM = reg.ban_start_month;
  const startD = reg.ban_start_day ?? 1;
  const endM = reg.ban_end_month;
  const endD = reg.ban_end_day ?? 28;

  if (startM === endM) {
    return month === startM && day >= startD && day <= endD;
  }
  if (month === startM) return day >= startD;
  if (month === endM) return day <= endD;
  return month > startM && month < endM;
}

const TYPE_CONFIG: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  seasonal_ban: {
    bg: 'bg-red-950/60',
    border: 'border-red-500/40',
    icon: <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
    label: 'Seasonal Ban',
  },
  size_limit: {
    bg: 'bg-amber-950/50',
    border: 'border-amber-500/30',
    icon: <Ruler className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    label: 'Size Limit',
  },
  protected_species: {
    bg: 'bg-orange-950/50',
    border: 'border-orange-500/30',
    icon: <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />,
    label: 'Protected Species',
  },
  gear_restriction: {
    bg: 'bg-yellow-950/50',
    border: 'border-yellow-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />,
    label: 'Gear Restriction',
  },
  general: {
    bg: 'bg-blue-950/50',
    border: 'border-blue-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
    label: 'Regulation',
  },
};

async function getRegulations(slug: string): Promise<Regulation[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('fishing_regulations')
      .select('id,title,regulation_type,description,ban_start_month,ban_start_day,ban_end_month,ban_end_day,ban_scope,min_size_cm,min_weight_kg,authority,legal_ref,source_url')
      .eq('is_active', true)
      .contains('species_slugs', [slug]);

    if (error) throw error;
    return (data ?? []) as Regulation[];
  } catch {
    return [];
  }
}

export default async function RegulationAlert({ slug }: { slug: string }) {
  const regs = await getRegulations(slug);
  if (regs.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        UAE Fishing Regulations
      </h2>

      {regs.map((reg) => {
        const cfg = TYPE_CONFIG[reg.regulation_type] ?? TYPE_CONFIG.general;
        const banPeriod = formatBanPeriod(reg);
        const activeBan = isBanActive(reg);

        return (
          <div
            key={reg.id}
            className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
          >
            <div className="flex items-start gap-3">
              {cfg.icon}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    reg.regulation_type === 'seasonal_ban' ? 'text-red-400' :
                    reg.regulation_type === 'size_limit' ? 'text-amber-400' :
                    reg.regulation_type === 'protected_species' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>
                    {cfg.label}
                  </span>
                  {activeBan && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                      ACTIVE NOW
                    </span>
                  )}
                  {banPeriod && !activeBan && (
                    <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      {banPeriod} annually
                    </span>
                  )}
                </div>

                <p className="text-white text-sm font-medium mb-1">{reg.title}</p>

                {/* Key facts */}
                <div className="space-y-1">
                  {banPeriod && (
                    <p className="text-gray-300 text-xs">
                      <span className="text-gray-500">Ban period:</span>{' '}
                      <strong>{banPeriod}</strong> — no fishing or trade of this species
                    </p>
                  )}
                  {reg.min_size_cm && (
                    <p className="text-gray-300 text-xs">
                      <span className="text-gray-500">Minimum size:</span>{' '}
                      <strong>{reg.min_size_cm} cm</strong> total length
                    </p>
                  )}
                  {reg.ban_scope === 'all' && (
                    <p className="text-gray-300 text-xs">
                      <span className="text-gray-500">Scope:</span>{' '}
                      Fishing <strong>and</strong> trade/sales banned — including imported stock
                    </p>
                  )}
                  {reg.legal_ref && (
                    <p className="text-gray-500 text-xs">Authority: {reg.authority} · {reg.legal_ref}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <Link
                    href="/regulations"
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    All UAE Fishing Regulations →
                  </Link>
                  {reg.source_url && (
                    <a
                      href={reg.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      MOCCAE Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
