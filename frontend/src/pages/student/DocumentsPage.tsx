import { useEffect, useState } from 'react';
import { FileText, Upload, Trash2, Download, File } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';

interface Document {
  _id: string;
  name: string;
  path: string;
  type: string;
  createdAt: string;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await httpClient.post('/api/student/documents', { userId });
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('user_id');
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('file', file);
      formData.append('userId', userId || '');

      await httpClient.post('/api/student/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocuments();
    } catch (err) {
      setError('Failed to upload document');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await httpClient.delete(`/api/student/documents/${docId}`);
      setDocuments(documents.filter((d) => d._id !== docId));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('word') || type.includes('doc')) return 'text-blue-500';
    if (type.includes('image')) return 'text-green-500';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-6 shadow-xl flex-1 mr-6">
          <h1 className="text-3xl font-bold text-white">My Documents</h1>
          <p className="text-primary-100 mt-1">Upload and manage your documents</p>
        </div>
        <label className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl cursor-pointer flex items-center gap-2 shrink-0">
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Document
            </>
          )}
          <input
            type="file"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-xl mb-6 font-medium">{error}</div>
      )}

      {documents.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 rounded-3xl border-2 border-dashed border-emerald-300 p-16 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6 shadow-2xl shadow-emerald-500/40 animate-pulse">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Documents Yet</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">Upload your CV, certificates, transcripts, and other important documents to share with employers</p>
            <label className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all font-bold text-lg shadow-2xl shadow-emerald-500/40 hover:shadow-3xl hover:shadow-emerald-500/50 hover:scale-105 transform cursor-pointer">
              <Upload className="w-6 h-6" />
              Upload Your First Document
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Document Name</th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Upload Date</th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-md">
                          <File className={`w-6 h-6 ${getFileIcon(doc.type)}`} />
                        </div>
                        <span className="text-gray-900 font-semibold">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{doc.type}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-medium text-sm">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={doc.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-primary-600 hover:bg-primary-50 rounded-xl transition-all border-2 border-transparent hover:border-primary-200"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
