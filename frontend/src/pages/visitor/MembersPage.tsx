import { User, Building2, ArrowRight, CheckCircle, Briefcase, GraduationCap, Globe2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

const studentSteps = [
  {
    title: 'Create your profile',
    description: 'Showcase your track, projects, and availability in minutes.',
    icon: GraduationCap,
  },
  {
    title: 'Discover opportunities',
    description: 'Browse internships, PFE, and entry roles curated for ENIT.',
    icon: Briefcase,
  },
  {
    title: 'Connect and apply',
    description: 'Apply fast and keep companies updated with your progress.',
    icon: User,
  },
];

const companySteps = [
  {
    title: 'Register your company',
    description: 'Build a trusted company profile and share your hiring needs.',
    icon: Building2,
  },
  {
    title: 'Post and filter offers',
    description: 'Target specializations and surface the right student talent.',
    icon: Sparkles,
  },
  {
    title: 'Shortlist quickly',
    description: 'Track applicants and move to interviews faster.',
    icon: ShieldCheck,
  },
];

const benefits = [
  {
    title: 'Verified talent pool',
    description: 'Every profile belongs to ENIT students with validated tracks.',
    icon: ShieldCheck,
  },
  {
    title: 'Faster matching',
    description: 'Smart filters highlight the right candidates and roles.',
    icon: Sparkles,
  },
  {
    title: 'Global reach',
    description: 'Connect with companies and students across borders.',
    icon: Globe2,
  },
];

const faqs = [
  {
    question: 'Is ENIT Connect free for students?',
    answer: 'Yes. Students can create profiles, browse offers, and apply at no cost.',
  },
  {
    question: 'Can companies post multiple offers?',
    answer: 'Yes. Companies can publish internships, PFE, and entry-level roles.',
  },
  {
    question: 'How are profiles verified?',
    answer: 'We review each profile and highlight ENIT tracks and projects.',
  },
];

export function MembersPage() {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white p-10">
        <div className="absolute -top-20 -right-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-44 w-44 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            How It Works
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">A clearer path from campus to career</h1>
          <p className="text-white/80">
            ENIT Connect helps students and companies move faster with verified profiles,
            structured offers, and a simple matching flow.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90">
              Get started as a student
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Post a company offer
            </Button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">For Students</h2>
              <p className="text-sm text-gray-500">Build your profile and apply fast.</p>
            </div>
          </div>
          <div className="space-y-4">
            {studentSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-gray-100 p-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <Icon className="w-4 h-4 text-blue-600" />
                      {step.title}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">For Companies</h2>
              <p className="text-sm text-gray-500">Publish offers and meet talent fast.</p>
            </div>
          </div>
          <div className="space-y-4">
            {companySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-gray-100 p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      {step.title}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid gap-6 md:grid-cols-3">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div key={benefit.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{benefit.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{benefit.description}</p>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Frequently Asked</h2>
            <p className="text-sm text-gray-500">Clear answers for visitors.</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900">{faq.question}</h3>
              <p className="text-sm text-gray-600 mt-2">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-3xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-3">Ready to get started?</h3>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            Create a profile, post an offer, and connect with ENIT talent in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary-900 hover:bg-white/90">
              Create student profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Register company
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
