import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Package, ShoppingBag, Truck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { PremiumBadge } from '@/components/ui';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ username: string }>;
}

interface Listing {
  id: string;
  title: string;
  price: number | null;
  photos: string[] | null;
  emirate: string | null;
  is_sold: boolean;
  created_at: string;
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getDealer(username: string) {
  const { data: profile } = await supabase()
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, emirate, created_at')
    .eq('username', username)
    .maybeSingle();
  if (!profile) return null;
  const { data: merchant } = await getSupabaseAdmin()
    .from('commerce_merchants')
    .select('display_name, seller_class, enabled, delivery_days, whatsapp_e164')
    .eq('user_id', profile.id)
    .maybeSingle();
  if (!merchant?.enabled || merchant.seller_class !== 'dealer') return null;
  return { profile, merchant };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const dealer = await getDealer(username);
  if (!dealer) return { title: 'Dealer not found — UAE Anglers' };
  return {
    title: `${dealer.merchant.display_name} — Verified Dealer · UAE Anglers`,
    description: `Shop tackle and gear from ${dealer.merchant.display_name}, a verified UAE Anglers Hub dealer${dealer.profile.emirate ? ` in ${dealer.profile.emirate}` : ''}.`,
  };
}

export default async function DealerStorefront({ params }: PageProps) {
  const { username } = await params;
  const dealer = await getDealer(username);
  if (!dealer) notFound();
  const { profile, merchant } = dealer;

  const admin = getSupabaseAdmin();
  const [{ data: listings }, { count: soldCount }] = await Promise.all([
    admin
      .from('listings')
      .select('id, title, price, photos, emirate, is_sold, created_at')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('is_sold', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(48),
    admin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_sold', true),
  ]);

  const active = ((listings ?? []) as Listing[]).filter((l) => !l.is_sold);
  const sold = ((listings ?? []) as Listing[]).filter((l) => l.is_sold);
  const initial = (merchant.display_name ?? '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f9fa] text-[#182e3c]">
      {/* Storefront header */}
      <div className="border-b border-[#e1e7eb] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#18333f] text-3xl font-bold text-[#d4af5a]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.03em] text-[#15313f]">
                {merchant.display_name}
              </h1>
              <PremiumBadge label="Verified Dealer" />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[#5b6b77]">
              {profile.emirate && (
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#23675e]" /> {profile.emirate}</span>
              )}
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#23675e]" /> Dealing since {new Date(profile.created_at).getFullYear()}</span>
              {merchant.delivery_days && (
                <span className="flex items-center gap-1.5"><Truck size={14} className="text-[#23675e]" /> Ships in {merchant.delivery_days} day{merchant.delivery_days === 1 ? '' : 's'}</span>
              )}
            </div>
            {profile.bio && <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5b6b77]">{profile.bio}</p>}
          </div>
          <div className="flex gap-6 sm:flex-col sm:gap-2 sm:text-right">
            <div>
              <span className="block font-serif text-2xl text-[#18333f]">{active.length}</span>
              <span className="text-xs uppercase tracking-wider text-[#5b6b77]">in stock</span>
            </div>
            <div>
              <span className="block font-serif text-2xl text-[#b8892d]">{soldCount ?? sold.length}</span>
              <span className="text-xs uppercase tracking-wider text-[#5b6b77]">sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5dc] bg-white/60 px-6 py-14 text-center">
            <ShoppingBag size={28} className="mx-auto mb-3 text-[#23675e]" />
            <p className="font-serif text-xl text-[#18333f]">Shelves being restocked</p>
            <p className="mt-1 text-sm text-[#5b6b77]">This dealer has no active listings right now — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {active.map((l) => (
              <Link
                key={l.id}
                href={`/shop/${l.id}`}
                className="group overflow-hidden rounded-xl border border-[#e1e7eb] bg-white transition-all hover:border-[#a8c9c2] hover:shadow-[0_12px_32px_#173b4a0b]"
              >
                <div className="h-36 bg-white p-3 sm:h-44">
                  {l.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photos[0]} alt={l.title} loading="lazy" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#dce4e8]"><Package size={32} /></div>
                  )}
                </div>
                <div className="border-t border-[#eef2f3] p-3.5">
                  <h3 className="truncate text-sm font-medium text-[#18333f] group-hover:text-[#23675e]">{l.title}</h3>
                  <p className="mt-1.5 font-serif text-lg tracking-tight text-[#18333f]">
                    {l.price != null ? `AED ${Number(l.price).toLocaleString('en-AE', { maximumFractionDigits: 2 })}` : 'Price on ask'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Recently sold — social proof */}
        {sold.length > 0 && (
          <p className="mt-8 text-center text-xs text-[#7a8891]">
            {soldCount ?? sold.length} item{(soldCount ?? sold.length) === 1 ? '' : 's'} sold through UAE Anglers Hub
          </p>
        )}
      </div>
    </div>
  );
}
