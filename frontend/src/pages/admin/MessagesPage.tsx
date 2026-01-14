import { MessageSquare } from 'lucide-react';

export function MessagesPage() {
  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Messages</h1>
        <p className="text-primary-100 text-lg">View and manage platform messages</p>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl border-2 border-dashed border-purple-300 p-16 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
        
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 mb-6 shadow-2xl shadow-purple-500/40 animate-pulse">
            <MessageSquare className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Messages Center</h3>
          <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">Message management features will be available here soon</p>
        </div>
      </div>
    </div>
  );
}
