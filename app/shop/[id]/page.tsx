import CheckoutButton from '@/components/commerce/CheckoutButton';
import ListingGallery from '@/components/commerce/ListingGallery';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Mail, MapPin, MessageCircle, Package, ShieldCheck, Store, Tag, Truck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { publicMetadata, productSchema, jsonLd, breadcrumbs } from '@/lib/seo';
import { PremiumBadge } from '@/components/ui';

interface PageProps { params: Promise<{ id: string }> }

const CONDITIONS: Record<string, string> = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' };

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  photos: string[] | null;
  condition: string;
  category: string;
  emirate: string | null;
  is_sold: boolean;
  is_boosted: boolean | null;
  stock_quantity: number;
  contact_whatsapp: string | null;
  contact_email: string | null;
  user_id: string;
  profiles: {
    display_name: string | null;
    username: string | null;
    shop_name: string | null;
    avatar_url: string | null;
    verified_retailer: boolean | null;
  } | null;
}

function supabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase().from('listings').select('title, description, photos').eq('id', id).eq('is_active', true).single();
  if (!data) return { title: 'Listing not found', robots: { index: false } };
  return publicMetadata(`/shop/${encodeURIComponent(id)}`, data.title, data.description?.slice(0, 160) || `${data.title} on the UAEAngler fishing tackle marketplace.`, data.photos?.[0]);
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  const { data: raw } = await supabase()
    .from('listings')
    .select('*, profiles(display_name, username, shop_name, avatar_url, verified_retailer)')
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (!raw) notFound();
  const l = raw as unknown as Listing;

  // Dealer shipping terms (if the seller is a commerce merchant)
  const { data: merchant } = await getSupabaseAdmin()
    .from('commerce_merchants')
    .select('delivery_days, seller_class, enabled')
    .eq('user_id', l.user_id)
    .maybeSingle();
  const isDealer = Boolean(merchant?.enabled && merchant.seller_class === 'dealer') || Boolean(l.profiles?.verified_retailer);
  const sellerName = l.profiles?.shop_name ?? l.profiles?.display_name ?? 'UAEAngler seller';

  // Related gear — same category, boosted first
  const { data: relatedRaw } = await supabase()
    .from('listings')
    .select('id, title, price, photos, condition, is_boosted, profiles(display_name, shop_name)')
    .eq('is_active', true)
    .eq('is_sold', false)
    .eq('category', l.category)
    .neq('id', id)
    .order('is_boosted', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(4);
  const related = (relatedRaw ?? []) as Array<{
    id: string; title: string; price: number | null; photos: string[] | null;
    condition: string; is_boosted: boolean | null;
    profiles: { display_name: string | null; shop_name: string | null } | { display_name: string | null; shop_name: string | null }[] | null;
  }>;

  return (
    <div className="min-h-screen bg-[#f7f9fa] pb-16 pt-24 text-[#182e3c]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productSchema(l)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs([{ name: 'UAEAngler', path: '/' }, { name: 'Fishing tackle', path: '/shop' }, { name: l.title, path: `/shop/${id}` }])) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#7a8891]">
          <Link href="/shop" className="hover:text-[#23675e]">Marketplace</Link>
          <ChevronRight size={12} />
          <Link href={`/shop?category=${encodeURIComponent(l.category)}`} className="hover:text-[#23675e]">{l.category}</Link>
          <ChevronRight size={12} />
          <span className="line-clamp-1 max-w-64 text-[#4a5d68]">{l.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          {/* Gallery */}
          <div>
            {l.is_boosted && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-[#d4af5a]/60 bg-[#faf3e3] px-3 py-1 text-xs font-semibold text-[#8a651c]">
                ★ Featured listing
              </span>
            )}
            <ListingGallery photos={l.photos ?? []} title={l.title} />
          </div>

          {/* Buy box */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-tight tracking-[-0.02em] text-[#15313f]">{l.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#dce4e8] bg-white px-3 py-1 text-xs font-medium text-[#4a5d68]">
                  <Tag size={11} /> {l.category}
                </span>
                <span className="rounded-full border border-[#dce4e8] bg-white px-3 py-1 text-xs font-medium text-[#4a5d68]">
                  {CONDITIONS[l.condition] ?? l.condition}
                </span>
                {l.emirate && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#dce4e8] bg-white px-3 py-1 text-xs font-medium text-[#4a5d68]">
                    <MapPin size={11} /> {l.emirate}
                  </span>
                )}
                {l.stock_quantity <= 3 && !l.is_sold && (
                  <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    Only {l.stock_quantity} left
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e1e7eb] bg-white p-5">
              <p className="font-serif text-[clamp(1.8rem,3vw,2.4rem)] tracking-[-0.03em] text-[#15313f]">
                {l.price != null ? `AED ${Number(l.price).toLocaleString('en-AE', { maximumFractionDigits: 2 })}` : 'Price on request'}
              </p>
              {l.is_sold ? (
                <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">This item has been sold</p>
              ) : (
                <div className="mt-4 flex flex-col gap-2.5">
                  <CheckoutButton kind="gear" itemId={id} enabled={process.env.COMMERCE_CHECKOUT_ENABLED === 'true'} />
                  {l.contact_whatsapp && (
                    <a
                      href={`https://wa.me/${l.contact_whatsapp.replace(/\D/g, '')}?text=Hi, I'm interested in your listing: ${encodeURIComponent(l.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1fb457]"
                    >
                      <MessageCircle size={16} /> WhatsApp seller
                    </a>
                  )}
                  {l.contact_email && (
                    <a
                      href={`mailto:${l.contact_email}?subject=Interested in: ${encodeURIComponent(l.title)}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cbd5dc] px-5 text-sm font-semibold text-[#18333f] transition-colors hover:bg-[#eaf1f2]"
                    >
                      <Mail size={16} /> Email seller
                    </a>
                  )}
                </div>
              )}

              {/* Trust panel */}
              <div className="mt-5 space-y-2.5 border-t border-[#eef2f3] pt-4 text-sm text-[#5b6b77]">
                {merchant?.delivery_days && (
                  <p className="flex items-center gap-2.5">
                    <Truck size={15} className="shrink-0 text-[#23675e]" />
                    Ships within {merchant.delivery_days} day{merchant.delivery_days === 1 ? '' : 's'}
                  </p>
                )}
                <p className="flex items-center gap-2.5">
                  <ShieldCheck size={15} className="shrink-0 text-[#23675e]" />
                  Secure checkout — payment held until delivery confirmed
                </p>
                <p className="flex items-center gap-2.5">
                  <Package size={15} className="shrink-0 text-[#23675e]" />
                  Real photos from the seller, reviewed before publishing
                </p>
              </div>
            </div>

            {/* Dealer card */}
            <Link
              href={isDealer && l.profiles?.username ? `/dealers/${l.profiles.username}` : l.profiles?.username ? `/profile/${l.profiles.username}` : '#'}
              className="group flex items-center gap-4 rounded-2xl border border-[#e1e7eb] bg-white p-4 transition-all hover:border-[#a8c9c2] hover:shadow-[0_12px_32px_#173b4a0b]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#18333f] text-lg font-bold text-[#d4af5a]">
                {l.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  sellerName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-[#18333f] group-hover:text-[#23675e]">{sellerName}</p>
                  {isDealer && <PremiumBadge label="Verified Dealer" />}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-[#7a8891]">
                  <Store size={11} />
                  {isDealer ? 'Visit dealer storefront' : 'View seller profile'}
                </p>
              </div>
              <ChevronRight size={17} className="shrink-0 text-[#a8c9c2] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Description */}
        {l.description && (
          <section className="mt-10 max-w-3xl">
            <h2 className="font-serif text-2xl tracking-[-0.02em] text-[#18333f]">About this item</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[#4a5d68]">{l.description}</p>
          </section>
        )}

        {/* Related gear */}
        {related.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-2xl tracking-[-0.02em] text-[#18333f]">More {l.category.toLowerCase()} gear</h2>
              <Link href={`/shop?category=${encodeURIComponent(l.category)}`} className="text-sm font-semibold text-[#23675e] underline underline-offset-4">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((r) => {
                const seller = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
                return (
                  <Link key={r.id} href={`/shop/${r.id}`} className="group overflow-hidden rounded-xl border border-[#e1e7eb] bg-white transition-all hover:border-[#a8c9c2] hover:shadow-[0_12px_32px_#173b4a0b]">
                    <div className="relative flex aspect-square items-center justify-center bg-white p-4">
                      {r.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photos[0]} alt={r.title} loading="lazy" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Package size={36} className="text-[#dce4e8]" />
                      )}
                      {r.is_boosted && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#faf3e3] px-2 py-0.5 text-[10px] font-semibold text-[#8a651c]">★ Featured</span>
                      )}
                    </div>
                    <div className="border-t border-[#eef2f3] p-3.5">
                      <p className="truncate text-xs text-[#7a8891]">{seller?.shop_name ?? seller?.display_name ?? 'UAEAngler seller'}</p>
                      <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium text-[#18333f] group-hover:text-[#23675e]">{r.title}</h3>
                      <p className="mt-2 font-serif text-lg tracking-tight text-[#18333f]">
                        {r.price != null ? `AED ${Number(r.price).toLocaleString('en-AE')}` : 'Ask for price'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
