import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Offer } from '@/entities/offer/types';
import { formatDate, cn } from '@/shared/lib/utils';

export function CandidaciesListPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const typeColors: Record<string, string> = {
    PFA: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400',
    PFE: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400',
    Intership: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400',
    Job: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400',
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      const response = await httpClient.get(`/api/offers?companyId=${companyId}`);
      const allOffers = response.data;
      const myOffers = allOffers.filter((o: Offer) => o.companyid === companyId);
      setOffers(myOffers);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCandidacies = () => {
    return offers.reduce((sum, offer) => sum + (offer.candidacies?.length || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl">
        <h1 className="text-4xl font-bold text-white mb-2">All Candidacies</h1>
        <p className="text-primary-100 text-lg">
          Manage applications across all your job offers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Offers</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">{offers.length}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/40">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Applications</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">{getTotalCandidacies()}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/40">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Offers</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">
                {offers.filter(o => o.candidacies && o.candidacies.length > 0).length}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/40">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first job offer to start receiving applications</p>
          <Link
            to="/company/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-500/30"
          >
            Create Offer
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Your Offers</h2>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-semibold border border-primary-200">
                {offers.length} total offer{offers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="grid gap-6">
            {offers.map((offer) => {
              const candidacyCount = offer.candidacies?.length || 0;
              
              return (
                <div key={offer._id} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Colored top bar based on type */}
                  <div className={cn(
                    'h-1.5',
                    offer.type === 'PFA' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    offer.type === 'PFE' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    offer.type === 'Intership' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                    'bg-gradient-to-r from-amber-500 to-amber-600'
                  )} />
                  
                  <div className="p-8">
                    <div className="flex items-start gap-8">
                      <div className="flex-1 min-w-0">
                        {/* Type badge and title */}
                        <div className="flex items-center gap-4 mb-4">
                          <span className={cn('px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide', typeColors[offer.type])}>
                            {offer.type}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{offer.title}</h3>
                        </div>
                        
                        {/* Description */}
                        <p className="text-gray-600 leading-relaxed mb-6 text-base line-clamp-3">{offer.content}</p>
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold text-gray-700 text-sm">Posted {offer.createdAt ? formatDate(offer.createdAt) : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-emerald-700 text-lg">{candidacyCount}</span>
                            <span className="text-emerald-600 font-medium text-sm">applicant{candidacyCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/company/candidacies/${offer._id}`}
                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transform shrink-0"
                      >
                        View Applications
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>

                    {candidacyCount > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-700">Recent applicants:</span>
                          <div className="flex -space-x-3">
                            {offer.candidacies?.slice(0, 5).map((_, i) => (
                              <div
                                key={i}
                                className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-3 border-white flex items-center justify-center text-white text-sm font-bold shadow-lg"
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                          {candidacyCount > 5 && (
                            <span className="text-sm font-medium text-gray-600 px-3 py-1 bg-gray-100 rounded-full">+{candidacyCount - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
