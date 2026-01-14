import { FileText } from 'lucide-react';

export function DocumentsPage() {
  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Documents</h1>
        <p className="text-primary-100 text-lg">Manage platform documents</p>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border-2 border-dashed border-blue-300 p-16 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
        
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-2xl shadow-blue-500/40 animate-pulse">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Documents Management</h3>
          <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">Document management features will be available here soon</p>
        </div>
      </div>
    </div>
  );
}
