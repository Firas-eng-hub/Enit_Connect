import { BarChart3, Users, Building2, Briefcase, TrendingUp, Award, Target, Zap, GraduationCap, Globe } from 'lucide-react';

export function StatisticsPage() {
  const mainStats = [
    { 
      label: 'Active Students', 
      value: '500+', 
      change: '+12%',
      icon: Users, 
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50'
    },
    { 
      label: 'Partner Companies', 
      value: '50+', 
      change: '+8%',
      icon: Building2, 
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50'
    },
    { 
      label: 'Job Opportunities', 
      value: '200+', 
      change: '+25%',
      icon: Briefcase, 
      gradient: 'from-purple-500 to-violet-600',
      bgLight: 'bg-purple-50'
    },
    { 
      label: 'Successful Placements', 
      value: '350+', 
      change: '+18%',
      icon: Award, 
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50'
    },
  ];

  const offerTypes = [
    { type: 'Internship (PFE)', count: 85, percentage: 42, color: 'bg-blue-500' },
    { type: 'Summer Internship', count: 45, percentage: 22, color: 'bg-emerald-500' },
    { type: 'Full-time Position', count: 40, percentage: 20, color: 'bg-purple-500' },
    { type: 'Part-time Job', count: 30, percentage: 16, color: 'bg-amber-500' },
  ];

  const topSectors = [
    { name: 'Information Technology', companies: 18, icon: Globe },
    { name: 'Engineering Services', companies: 12, icon: Target },
    { name: 'Manufacturing', companies: 8, icon: Zap },
    { name: 'Consulting', companies: 7, icon: TrendingUp },
    { name: 'Research & Development', companies: 5, icon: GraduationCap },
  ];

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-3">
          <BarChart3 className="w-4 h-4" />
          Platform Metrics
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Statistics & Insights</h2>
        <p className="text-gray-500 mt-2">Track the growth and impact of ENIT Connect</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Offers by Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Offers by Type</h3>
              <p className="text-sm text-gray-500 mt-1">Distribution of opportunities</p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
              Total: 200
            </div>
          </div>
          
          <div className="space-y-5">
            {offerTypes.map((offer) => (
              <div key={offer.type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{offer.type}</span>
                  <span className="text-sm font-bold text-gray-900">{offer.count} offers</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${offer.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${offer.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sectors */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Top Sectors</h3>
              <p className="text-sm text-gray-500 mt-1">Industries with most partners</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topSectors.map((sector, i) => {
              const Icon = sector.icon;
              return (
                <div 
                  key={sector.name}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group cursor-default"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm group-hover:shadow transition-shadow">
                    <span className="text-lg font-bold text-primary-600">#{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{sector.name}</div>
                    <div className="text-sm text-gray-500">{sector.companies} companies</div>
                  </div>
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Platform Growth</h3>
            <p className="text-sm text-gray-500 mt-1">Monthly registrations and activities</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Companies</span>
            </div>
          </div>
        </div>
        
        {/* Placeholder Chart */}
        <div className="h-64 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Chart visualization</p>
            <p className="text-gray-400 text-sm">Coming soon with real data</p>
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <GraduationCap className="w-10 h-10 mb-4 relative z-10" />
          <div className="text-4xl font-bold mb-2 relative z-10">95%</div>
          <div className="text-white/80 font-medium relative z-10">Employment Rate</div>
          <div className="text-white/60 text-sm mt-2 relative z-10">Within 6 months of graduation</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <Globe className="w-10 h-10 mb-4 relative z-10" />
          <div className="text-4xl font-bold mb-2 relative z-10">15+</div>
          <div className="text-white/80 font-medium relative z-10">Countries</div>
          <div className="text-white/60 text-sm mt-2 relative z-10">Where our alumni work</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <Award className="w-10 h-10 mb-4 relative z-10" />
          <div className="text-4xl font-bold mb-2 relative z-10">4.8/5</div>
          <div className="text-white/80 font-medium relative z-10">Satisfaction Score</div>
          <div className="text-white/60 text-sm mt-2 relative z-10">From platform users</div>
        </div>
      </div>
    </div>
  );
}
