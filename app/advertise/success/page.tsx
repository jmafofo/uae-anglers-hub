import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, BadgeCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Subscription Confirmed — UAE Anglers Hub',
};

export default function AdvertiseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  return (
    <SuccessContent searchParams={searchParams} />
  );
}

async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const isPro = plan === 'pro';
  const isBusiness = plan === 'business';

  const planLabel = isBusiness ? 'Business' : isPro ? 'Pro Retailer' : 'subscription';

  return (
    <div className="min-h-screen pt-20 px-4 pb-16 flex items-center justify-center">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-teal-400" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">You&apos;re live!</h1>
          <p className="text-gray-400">
            Your <span className="text-teal-400 font-semibold">{planLabel}</span> subscription is now active.
            Your account has been upgraded and your profile is now verified.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <BadgeCheck className="w-5 h-5 text-teal-400 mb-2" />
            <p className="text-sm font-semibold text-white mb-0.5">Verified Retailer badge</p>
            <p className="text-xs text-gray-500">Applied to all your listings automatically</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <ShoppingBag className="w-5 h-5 text-teal-400 mb-2" />
            <p className="text-sm font-semibold text-white mb-0.5">
              {isBusiness ? 'Unlimited' : isPro ? '50' : 'More'} listing slots
            </p>
            <p className="text-xs text-gray-500">Post gear and tackle immediately</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/shop/create"
            className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Post Your First Listing
          </Link>
          <Link
            href="/shop"
            className="border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>

        <p className="text-xs text-gray-600">
          Questions? Email{' '}
          <a href="mailto:info@uaeangler.com" className="text-teal-400 hover:underline">
            info@uaeangler.com
          </a>
        </p>
      </div>
    </div>
  );
}
