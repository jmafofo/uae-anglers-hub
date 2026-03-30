import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MapPin, Tag, MessageCircle, Mail, ShoppingBag } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.from('listings').select('title, description').eq('id', id).single();
  if (!data) return { title: 'Listing not found' };
  return { title: `${data.title} — UAE Anglers Hub Marketplace`, description: data.description ?? undefined };
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: l } = await supabase.from('listings').select('*, profiles(display_name,username)').eq('id', id).single();
  if (!l) notFound();

  const CONDITIONS: Record<string, string> = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' };

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>

        {/* Photos */}
        {l.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {l.photos.slice(0, 4).map((url: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={l.title} className={`rounded-xl object-cover w-full ${i === 0 ? 'col-span-2 h-64' : 'h-36'}`} />
            ))}
          </div>
        )}
        {(!l.photos || l.photos.length === 0) && (
          <div className="w-full h-48 rounded-xl bg-white/5 flex items-center justify-center mb-6">
            <ShoppingBag className="w-16 h-16 text-gray-700" />
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-white flex-1 pr-4">{l.title}</h1>
          {l.is_sold && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full shrink-0">Sold</span>}
        </div>

        <div className="text-3xl font-bold text-teal-400 mb-4">
          {l.price ? `AED ${Number(l.price).toLocaleString()}` : 'Price on request'}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3" /> {l.category}
          </span>
          <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-3 py-1 rounded-full">
            {CONDITIONS[l.condition] ?? l.condition}
          </span>
          {l.emirate && (
            <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {l.emirate}
            </span>
          )}
        </div>

        {l.description && (
          <p className="text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap">{l.description}</p>
        )}

        {/* Contact seller */}
        {!l.is_sold && (
          <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-6">
            <p className="text-sm text-gray-400 mb-4">
              Listed by{' '}
              <Link href={`/profile/${(l.profiles as { username: string })?.username}`} className="text-teal-400 hover:underline">
                {(l.profiles as { display_name: string })?.display_name}
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {l.contact_whatsapp && (
                <a
                  href={`https://wa.me/${l.contact_whatsapp.replace(/\D/g, '')}?text=Hi, I'm interested in your listing: ${encodeURIComponent(l.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-lg font-semibold text-sm transition-colors flex-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Seller
                </a>
              )}
              {l.contact_email && (
                <a
                  href={`mailto:${l.contact_email}?subject=Interested in: ${encodeURIComponent(l.title)}`}
                  className="flex items-center justify-center gap-2 border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white px-5 py-3 rounded-lg font-semibold text-sm transition-colors flex-1"
                >
                  <Mail className="w-4 h-4" />
                  Email Seller
                </a>
              )}
            </div>
          </div>
        )}

        <Link href="/shop" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to all listings
        </Link>
      </div>
    </div>
  );
}
