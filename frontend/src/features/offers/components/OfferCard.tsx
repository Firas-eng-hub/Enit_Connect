import { Building2, Calendar } from 'lucide-react';
import type { Offer } from '@/entities/offer/types';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { formatDate, cn } from '@/shared/lib/utils';

interface OfferCardProps {
  offer: Offer;
  companyName?: string;
  companyLogo?: string;
  onApply?: () => void;
  showApplyButton?: boolean;
}

const typeColors: Record<string, string> = {
  PFA: 'bg-blue-100 text-blue-700',
  PFE: 'bg-purple-100 text-purple-700',
  Intership: 'bg-green-100 text-green-700',
  Job: 'bg-orange-100 text-orange-700',
};

export function OfferCard({
  offer,
  companyName,
  companyLogo,
  onApply,
  showApplyButton = true,
}: OfferCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Company info */}
        <div className="flex items-center gap-3 mb-4">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{companyName || 'Unknown Company'}</p>
          </div>
        </div>

        {/* Type badge */}
        <span
          className={cn(
            'inline-block px-2 py-1 rounded text-xs font-medium mb-3',
            typeColors[offer.type] || 'bg-gray-100 text-gray-700'
          )}
        >
          {offer.type}
        </span>

        {/* Title and content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{offer.content}</p>

        {/* Dates */}
        {(offer.start || offer.end) && (
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Calendar className="w-4 h-4 mr-1" />
            {offer.start && formatDate(offer.start)} - {offer.end && formatDate(offer.end)}
          </div>
        )}

        {/* Apply button */}
        {showApplyButton && onApply && (
          <Button onClick={onApply} className="w-full">
            Apply Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
