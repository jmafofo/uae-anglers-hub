import Link from 'next/link';
import { Fish, ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 90% 70% at 50% 100%, rgba(0,180,150,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 20% 20%,  rgba(0,80,200,0.08)  0%, transparent 50%),
          #060d18
        `,
      }} />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Join the Community</p>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Fish smarter.<br />
          <span className="text-teal-400">Leave a record that matters.</span>
        </h2>
        <p className="text-gray-400 mb-10 text-lg max-w-lg mx-auto">
          Free premium access for the first 500 members. Every catch you log
          helps build the UAE&apos;s marine future.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup"
            className="group flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:-translate-y-0.5">
            Get Free Early Access
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/log-catch"
            className="flex items-center gap-2 border border-white/20 hover:border-white text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
            <Fish className="w-5 h-5" />
            Log a Catch
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-6">
          Already a member?{' '}
          <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
