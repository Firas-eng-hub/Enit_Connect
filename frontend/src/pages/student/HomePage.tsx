import { useEffect, useState } from 'react';
import { Building2, Calendar, Briefcase, Send } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Offer } from '@/entities/offer/types';
import { formatDate, cn } from '@/shared/lib/utils';

interface CompanyInfo {
  _id: string;
  name: string;
  logo?: string;
  sector?: string;
}

export function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [companiesInfo, setCompaniesInfo] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [applicationText, setApplicationText] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await httpClient.get('/api/offers');
      const offersData = response.data;
      setOffers(offersData);

      // Fetch company info for all offers
      if (offersData.length > 0) {
        const companyIds = offersData.map((o: Offer) => o.companyid);
        const companiesResponse = await httpClient.post('/api/student/companiesinfo', {
          companies: companyIds,
        });
        setCompaniesInfo(companiesResponse.data);
      }
    } catch (err) {
      setError('Failed to load offers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyForOffer = (companyId: string): CompanyInfo | undefined => {
    return companiesInfo.find((c) => c._id === companyId);
  };

  const handleApply = async () => {
    if (!selectedOffer || !applicationText.trim()) return;
    
    // Ensure offer has valid ID
    if (!selectedOffer._id) {
      console.error('Offer ID is missing');
      return;
    }

    setApplyLoading(true);
    try {
      await httpClient.post(`/api/student/apply/${selectedOffer._id}`, {
        body: applicationText,
      });
      setApplySuccess(true);
      setApplicationText('');
      setTimeout(() => {
        setSelectedOffer(null);
        setApplySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to apply:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    PFA: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400',
    PFE: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400',
    Intership: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400',
    Job: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Available Offers</h1>
        <p className="text-primary-100 text-lg">Browse and apply to internships and job opportunities</p>
      </div>

      {offers.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-emerald-50 rounded-3xl border-2 border-dashed border-primary-300 p-16 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 mb-6 shadow-2xl shadow-primary-500/40 animate-pulse">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Offers Available Yet</h3>
            <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">New opportunities are posted regularly. Check back soon to find your next internship or job!</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const company = getCompanyForOffer(offer.companyid);
            return (
              <div key={offer._id} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Colored top bar */}
                <div className={cn(
                  'h-1.5',
                  offer.type === 'PFA' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  offer.type === 'PFE' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                  offer.type === 'Intership' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                  'bg-gradient-to-r from-amber-500 to-amber-600'
                )} />
                
                <div className="p-6">
                  {/* Company info */}
                  <div className="flex items-center gap-3 mb-4">
                    {company?.logo ? (
                      <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-xl object-cover shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md">
                        <Building2 className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{company?.name || 'Unknown Company'}</p>
                      {company?.sector && <p className="text-sm text-gray-500 truncate">{company.sector}</p>}
                    </div>
                  </div>

                  {/* Offer type badge */}
                  <span className={cn('inline-block px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide mb-3', typeColors[offer.type] || 'bg-gray-100 text-gray-700')}>
                    {offer.type}
                  </span>

                  {/* Offer title and content */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">{offer.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{offer.content}</p>

                  {/* Dates */}
                  {(offer.start || offer.end) && (
                    <div className="flex items-center text-sm text-gray-600 mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {offer.start && formatDate(offer.start)}{offer.start && offer.end && ' - '}{offer.end && formatDate(offer.end)}
                      </span>
                    </div>
                  )}

                  {/* Apply button */}
                  <button
                    onClick={() => setSelectedOffer(offer)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transform"
                  >
                    <Send className="w-5 h-5" />
                    Apply Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !applySuccess && setSelectedOffer(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {applySuccess ? (
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/40">
                  <Send className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Sent!</h3>
                <p className="text-gray-600">Your application has been submitted successfully.</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Apply to: {selectedOffer.title}
                  </h3>
                  <p className="text-primary-100">Write a compelling cover letter for your application</p>
                </div>

                <div className="p-8">
                  <textarea
                    value={applicationText}
                    onChange={(e) => setApplicationText(e.target.value)}
                    placeholder="Tell the company why you're a great fit for this position...\n\nHighlight your relevant skills, experience, and passion for the role."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none h-48 mb-6"
                  />

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedOffer(null)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applyLoading || !applicationText.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {applyLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
