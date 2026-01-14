import { Briefcase } from 'lucide-react';
import type { Offer } from '@/entities/offer/types';
import { OfferCard } from './OfferCard';

interface CompanyInfo {
  _id: string;
  name: string;
  logo?: string;
}

interface OfferListProps {
  offers: Offer[];
  companies?: CompanyInfo[];
  onApply?: (offer: Offer) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function OfferList({
  offers,
  companies = [],
  onApply,
  loading,
  emptyMessage = 'No offers available',
}: OfferListProps) {
  const getCompany = (companyId: string) => companies.find((c) => c._id === companyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No offers</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => {
        const company = getCompany(offer.companyid);
        return (
          <OfferCard
            key={offer._id}
            offer={offer}
            companyName={company?.name}
            companyLogo={company?.logo}
            onApply={() => onApply?.(offer)}
          />
        );
      })}
    </div>
  );
}
