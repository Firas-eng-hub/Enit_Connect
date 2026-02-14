import { Handshake } from 'lucide-react';
import { usePartners } from '@/entities/partner';

export function PartnerLogoMarquee() {
  const { data: partners = [], isLoading, isError, refetch } = usePartners(15000);

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2 text-primary-900">
          <Handshake className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Our Partners</h3>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </section>
    );
  }

  if (isError && partners.length === 0) {
    return (
      <section className="mb-12 bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">Failed to load partner logos.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!isLoading && partners.length === 0) {
    return null;
  }

  const repeatCount = Math.max(2, Math.ceil(14 / partners.length));
  const marqueeItems = Array.from({ length: repeatCount }).flatMap((_, repeatIndex) =>
    partners.map((partner) => ({
      ...partner,
      loopKey: `${partner._id}-${repeatIndex}`,
    }))
  );
  const animationDuration = `${Math.max(20, marqueeItems.length * 1.9)}s`;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2 text-primary-900">
        <Handshake className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Our Partners</h3>
      </div>

      <div className="partner-marquee rounded-2xl border border-gray-100 bg-white/90 shadow-sm">
        <div className="partner-marquee-track" style={{ animationDuration }}>
          <ul className="partner-marquee-list">
            {marqueeItems.map((partner) => (
              <li key={partner.loopKey} className="partner-marquee-item">
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  loading="lazy"
                  className="h-12 sm:h-14 md:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </li>
            ))}
          </ul>
          <ul className="partner-marquee-list" aria-hidden="true">
            {marqueeItems.map((partner) => (
              <li key={`${partner.loopKey}-duplicate`} className="partner-marquee-item">
                <img
                  src={partner.logoUrl}
                  alt=""
                  loading="lazy"
                  className="h-12 sm:h-14 md:h-16 w-auto object-contain opacity-90"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
