import { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, Search, Send } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { config } from '@/app/config/env';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';
import { getApiErrorMessage } from '@/shared/lib/utils';

type CompanyCard = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  logo?: string | null;
};

type CompanyBrowseResponse = {
  data?: CompanyCard[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type StudentDocument = {
  id: string;
  title: string;
  category?: string | null;
  tags?: string[];
  extension?: string | null;
};

const MAX_ATTACHMENTS = 5;
const COMPANY_PAGE_SIZE = 24;
const MAX_COMPANY_QUERY_LENGTH = 200;
const DOCUMENT_PAGE_SIZE = 50;
const MAX_DOCUMENT_PAGES = 20;

const resolveLogoUrl = (logo?: string | null) => {
  if (!logo) return null;
  const trimmed = logo.trim();
  if (!trimmed) return null;

  const apiBase = config.apiUrl || window.location.origin;
  if (trimmed.startsWith('/uploads')) {
    return config.apiUrl ? `${config.apiUrl}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith('uploads/')) {
    return config.apiUrl ? `${config.apiUrl}/${trimmed}` : `/${trimmed}`;
  }
  if (
    trimmed.startsWith('http://localhost') ||
    trimmed.startsWith('http://127.0.0.1') ||
    trimmed.startsWith('http://0.0.0.0') ||
    trimmed.startsWith('https://localhost') ||
    trimmed.startsWith('https://127.0.0.1')
  ) {
    try {
      const url = new URL(trimmed);
      return `${apiBase}${url.pathname}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

const isLikelyCv = (doc: StudentDocument) => {
  const haystack = `${doc.title} ${doc.category || ''} ${(doc.tags || []).join(' ')}`.toLowerCase();
  return haystack.includes('cv') || haystack.includes('resume') || haystack.includes('curriculum');
};

export function BrowseCompaniesPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [companies, setCompanies] = useState<CompanyCard[]>([]);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<CompanyCard | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchCompanies = async (offset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setHasMoreCompanies(false);
    }

    try {
      const response = await httpClient.get<CompanyBrowseResponse | CompanyCard[]>('/api/student/companies', {
        params: {
          q: debouncedQuery.slice(0, MAX_COMPANY_QUERY_LENGTH),
          limit: COMPANY_PAGE_SIZE,
          offset,
        },
      });
      const payload = response.data;
      const rows = Array.isArray(payload) ? payload : payload?.data || [];
      const hasMore = Array.isArray(payload)
        ? rows.length >= COMPANY_PAGE_SIZE
        : Boolean(payload?.pagination?.hasMore);

      setHasMoreCompanies(hasMore);
      if (append) {
        setCompanies((prev) => {
          const seen = new Set(prev.map((company) => company.id));
          const next = [...prev];
          rows.forEach((row) => {
            if (!seen.has(row.id)) {
              seen.add(row.id);
              next.push(row);
            }
          });
          return next;
        });
      } else {
        setCompanies(rows);
      }
    } catch (err) {
      if (!append) {
        setError(getApiErrorMessage(err, 'Failed to load companies.'));
        setCompanies([]);
      }
      setHasMoreCompanies(false);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const allRows: StudentDocument[] = [];
      const seen = new Set<string>();
      for (let page = 1; page <= MAX_DOCUMENT_PAGES; page += 1) {
        const response = await httpClient.get('/api/student/documents', {
          params: {
            type: 'file',
            emplacement: 'root',
            page,
            pageSize: DOCUMENT_PAGE_SIZE,
          },
        });

        const rows = (response.data?.items || []) as StudentDocument[];
        rows.forEach((row) => {
          if (!seen.has(row.id)) {
            seen.add(row.id);
            allRows.push(row);
          }
        });

        const total = Number(response.data?.total || 0);
        if (rows.length < DOCUMENT_PAGE_SIZE || allRows.length >= total) {
          break;
        }
      }

      setDocuments(allRows);

      const suggested = allRows.find(isLikelyCv);
      setSelectedDocumentIds(suggested?.id ? [suggested.id] : []);
    } catch {
      setDocuments([]);
      setSelectedDocumentIds([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      const aScore = isLikelyCv(a) ? 0 : 1;
      const bScore = isLikelyCv(b) ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return a.title.localeCompare(b.title);
    });
  }, [documents]);

  const openCompose = async (company: CompanyCard) => {
    setSelectedCompany(company);
    setSubject(`Application inquiry - ${company.name}`);
    setBody('');
    setComposeError(null);
    setComposeSuccess(null);
    await fetchDocuments();
  };

  const closeCompose = () => {
    setSelectedCompany(null);
    setSubject('');
    setBody('');
    setSelectedDocumentIds([]);
    setComposeError(null);
    setComposeSuccess(null);
  };

  const toggleDocumentSelection = (documentId: string) => {
    const isSelected = selectedDocumentIds.includes(documentId);
    if (!isSelected && selectedDocumentIds.length >= MAX_ATTACHMENTS) {
      setComposeError(`You can attach up to ${MAX_ATTACHMENTS} documents.`);
      return;
    }

    setComposeError(null);
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const sendMail = async () => {
    if (!selectedCompany) return;
    setSending(true);
    setComposeError(null);
    setComposeSuccess(null);

    try {
      await httpClient.post('/api/mail/compose', {
        subject,
        body,
        recipients: [{ id: selectedCompany.id, type: 'company' }],
        attachments: selectedDocumentIds.map((documentId) => ({ documentId })),
      });

      setComposeSuccess('Message sent successfully.');
      setTimeout(() => {
        closeCompose();
      }, 900);
    } catch (err) {
      setComposeError(getApiErrorMessage(err, 'Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 shadow-xl">
        <h1 className="text-4xl font-bold text-white mb-2">Browse Companies</h1>
        <p className="text-primary-100 text-lg">Find companies and contact them directly with your CV.</p>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies by name or email"
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-44 bg-white rounded-2xl border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">No companies found</h3>
          <p className="text-gray-500">Try another search keyword.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <article key={company.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  {resolveLogoUrl(company.logo) ? (
                    <img
                      src={resolveLogoUrl(company.logo) as string}
                      alt={company.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{company.email}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  leftIcon={<Mail className="w-4 h-4" />}
                  onClick={() => openCompose(company)}
                >
                  Send Mail
                </Button>
              </article>
            ))}
          </div>
          {hasMoreCompanies && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                isLoading={loadingMore}
                onClick={() => fetchCompanies(companies.length, true)}
              >
                Load More Companies
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(selectedCompany)}
        onClose={closeCompose}
        title={selectedCompany ? `Send Mail to ${selectedCompany.name}` : 'Send Mail'}
        description={selectedCompany?.email}
        size="lg"
      >
        <div className="space-y-4">
          {composeError && (
            <Alert variant="danger" onClose={() => setComposeError(null)}>
              {composeError}
            </Alert>
          )}
          {composeSuccess && (
            <Alert variant="success" onClose={() => setComposeSuccess(null)}>
              {composeSuccess}
            </Alert>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach Documents (optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Selected {selectedDocumentIds.length}/{MAX_ATTACHMENTS}
            </p>
            {documentsLoading ? (
              <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-500">
                Loading documents...
              </div>
            ) : sortedDocuments.length === 0 ? (
              <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                No documents found.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white divide-y divide-gray-100">
                {sortedDocuments.map((doc) => {
                  const checked = selectedDocumentIds.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {doc.title}
                          {isLikelyCv(doc) ? ' (Suggested CV)' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.extension ? `.${doc.extension}` : 'document'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="w-4 h-4"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeCompose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={sendMail}
            isLoading={sending}
            disabled={!subject.trim() || !body.trim()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send Message
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
