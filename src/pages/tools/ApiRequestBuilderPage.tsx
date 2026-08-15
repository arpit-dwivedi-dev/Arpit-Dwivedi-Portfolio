import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ClipboardPaste,
  Copy,
  History,
  Save,
  Send as SendIcon,
  ShieldCheck,
  Star,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { useLanguage } from '../../i18n/LanguageContext';
import { trackEvent } from '../../monitoring';
import { TOOLS, getToolCategory, categoryTitle, toolTitle } from '../../tools/registry';
import { useApiRequestBuilder, type RequestTab } from '../../tools/apiRequestBuilder/useApiRequestBuilder';
import { EXAMPLE_REQUESTS } from '../../tools/apiRequestBuilder/exampleRequests';
import {
  listHistory,
  deleteHistoryEntry,
  clearHistory,
  listSavedRequests,
  upsertSavedRequest,
  renameSavedRequest,
  deleteSavedRequest,
} from '../../tools/apiRequestBuilder/storage';
import { nextId, type ApiRequest, type HistoryEntry, type SavedRequest } from '../../tools/apiRequestBuilder/types';
import { generateCurlCommand } from '../../tools/apiRequestBuilder/curlGenerator';
import { buildUrlWithParams, decodeUrlComponent, encodeUrlComponent, splitUrlIntoParams, validateUrl } from '../../tools/apiRequestBuilder/urlUtils';
import { MethodSelect } from '../../components/tools/apiRequestBuilder/MethodSelect';
import { RequestTabs } from '../../components/tools/apiRequestBuilder/RequestTabs';
import { KeyValueEditor } from '../../components/tools/apiRequestBuilder/KeyValueEditor';
import { BodyEditor } from '../../components/tools/apiRequestBuilder/BodyEditor';
import { AuthEditor } from '../../components/tools/apiRequestBuilder/AuthEditor';
import { ResponseViewer } from '../../components/tools/apiRequestBuilder/ResponseViewer';
import { Drawer } from '../../components/tools/apiRequestBuilder/Drawer';
import { HistoryList } from '../../components/tools/apiRequestBuilder/HistoryList';
import { SavedRequestsList } from '../../components/tools/apiRequestBuilder/SavedRequestsList';
import { SaveRequestModal } from '../../components/tools/apiRequestBuilder/SaveRequestModal';
import { CurlImportModal } from '../../components/tools/apiRequestBuilder/CurlImportModal';
import { smallButtonClass } from '../../components/tools/apiRequestBuilder/sharedClasses';

const TOOL = TOOLS.find((t) => t.id === 'api-request-builder')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const SITE_ORIGIN = 'https://101techlabs.com';

type DrawerTab = 'history' | 'saved';

export const ApiRequestBuilderPage = () => {
  const { lang, content } = useLanguage();
  const toolsBase = lang === 'hi' ? '/hi/tools' : '/tools';
  const categoryHref = `${toolsBase}/${TOOL.category}`;

  const builder = useApiRequestBuilder();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedRequest[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('history');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const refreshHistory = () => setHistory(listHistory());
  const refreshSaved = () => setSaved(listSavedRequests());

  useEffect(() => {
    refreshHistory();
    refreshSaved();
    trackEvent('tool_view', { tool: 'api-request-builder' });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        builder.send();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSaveModalOpen(true);
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.send]);

  const handleSend = () => {
    void builder.send().then(refreshHistory);
  };

  const handleUrlPaste = (e: { clipboardData: DataTransfer; preventDefault: () => void }) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted.includes('?')) return;
    e.preventDefault();
    const { base, params } = splitUrlIntoParams(pasted);
    builder.setUrl(base);
    if (params.length > 0) builder.setParams([...builder.request.params, ...params]);
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    builder.loadRequest(entry.request);
    setCurrentSavedId(null);
    setDrawerOpen(false);
  };

  const handleLoadSaved = (item: SavedRequest) => {
    builder.loadRequest(item.request);
    setCurrentSavedId(item.id);
    setDrawerOpen(false);
  };

  const handleLoadExample = (request: ApiRequest) => {
    builder.loadRequest(request);
    setCurrentSavedId(null);
  };

  const handleCurlImport = (request: ApiRequest) => {
    builder.loadRequest(request);
    setCurrentSavedId(null);
  };

  const handleSaveRequest = (name: string) => {
    const existing = currentSavedId ? saved.find((s) => s.id === currentSavedId) : undefined;
    const record: SavedRequest = {
      id: existing?.id ?? nextId(),
      name,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      request: builder.request,
    };
    upsertSavedRequest(record);
    setCurrentSavedId(record.id);
    refreshSaved();
  };

  const handleDeleteHistoryEntry = (id: string) => {
    deleteHistoryEntry(id);
    refreshHistory();
  };

  const handleClearHistory = () => {
    clearHistory();
    refreshHistory();
  };

  const handleRenameSaved = (id: string, name: string) => {
    renameSavedRequest(id, name);
    refreshSaved();
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedRequest(id);
    if (id === currentSavedId) setCurrentSavedId(null);
    refreshSaved();
  };

  const handleClearRequest = () => {
    builder.resetRequest();
    setCurrentSavedId(null);
  };

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(generateCurlCommand(builder.request));
      setCurlCopied(true);
      window.setTimeout(() => setCurlCopied(false), 1500);
    } catch {
      // Clipboard permission denied — nothing else to do.
    }
  };

  const handleCopyUrl = async () => {
    const fullUrl = buildUrlWithParams(builder.request.url, builder.request.params);
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setUrlCopied(true);
      window.setTimeout(() => setUrlCopied(false), 1500);
    } catch {
      // Clipboard permission denied — nothing else to do.
    }
  };

  const urlValidation = builder.request.url.trim() ? validateUrl(builder.request.url) : { valid: true as const };
  const showEmptyState = builder.request.url.trim() === '';
  const currentSavedName = currentSavedId ? saved.find((s) => s.id === currentSavedId)?.name ?? '' : '';

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: toolTitle(TOOL, lang),
          url: `${SITE_ORIGIN}${categoryHref}/${TOOL.path}`,
          description: TOOL.description,
          inLanguage: 'en',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          provider: { '@id': `${SITE_ORIGIN}/#organization` },
        }}
      />

      <main id="main-content" className="pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
            <Breadcrumbs
              className="mb-2"
              backHref={categoryHref}
              backLabel={`Back to ${categoryTitle(TOOL_CATEGORY, lang)}`}
              items={[
                { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/', className: 'hidden sm:flex' },
                { name: content.toolsPage.breadcrumb, href: toolsBase, className: 'hidden sm:flex' },
                { name: categoryTitle(TOOL_CATEGORY, lang), href: categoryHref },
                { name: 'API Request Builder' },
              ]}
            />
            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">Free Developer Tool</span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gradient">API Request Builder</h1>
              <p className="text-secondary-text text-sm max-w-xl mt-1">
                Build, send, and inspect API requests directly from your browser.
              </p>
            </div>
          </motion.div>

          <div
            role="status"
            className="flex items-start gap-2 px-3 py-2 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-4 text-xs text-secondary-text leading-snug"
          >
            <ShieldCheck size={14} className="text-accent-blue shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-ink">Runs entirely in your browser.</strong> Requests are sent directly to the target API via{' '}
              <code className="font-mono text-ink">fetch()</code> — nothing passes through our servers. History and saved requests are
              stored only in this browser's local storage.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button type="button" onClick={() => { setDrawerTab('history'); setDrawerOpen(true); }} className={smallButtonClass}>
              <History size={13} aria-hidden="true" />
              History
            </button>
            <button type="button" onClick={() => { setDrawerTab('saved'); setDrawerOpen(true); }} className={smallButtonClass}>
              <Star size={13} aria-hidden="true" />
              Saved
            </button>
            <button type="button" onClick={() => setCurlModalOpen(true)} className={smallButtonClass}>
              <ClipboardPaste size={13} aria-hidden="true" />
              Import cURL
            </button>
            <button type="button" onClick={handleCopyCurl} className={smallButtonClass}>
              {curlCopied ? <Check size={13} aria-hidden="true" /> : <Terminal size={13} aria-hidden="true" />}
              {curlCopied ? 'Copied' : 'Copy as cURL'}
            </button>
            <button type="button" onClick={handleCopyUrl} disabled={!builder.request.url.trim()} className={smallButtonClass}>
              {urlCopied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {urlCopied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              type="button"
              onClick={() => builder.setUrl(encodeUrlComponent(builder.request.url))}
              disabled={!builder.request.url.trim()}
              title="Percent-encode the URL"
              className={smallButtonClass}
            >
              Encode
            </button>
            <button
              type="button"
              onClick={() => builder.setUrl(decodeUrlComponent(builder.request.url))}
              disabled={!builder.request.url.trim()}
              title="Percent-decode the URL"
              className={smallButtonClass}
            >
              Decode
            </button>
            <button type="button" onClick={handleClearRequest} className={smallButtonClass}>
              <Trash2 size={13} aria-hidden="true" />
              Clear
            </button>
          </div>

          {/* Method + URL + Send */}
          <div className="flex items-stretch mb-1">
            <MethodSelect value={builder.request.method} onChange={builder.setMethod} />
            <div className="flex-1 relative">
              <input
                ref={urlInputRef}
                type="text"
                value={builder.request.url}
                onChange={(e) => builder.setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                placeholder="https://api.example.com/endpoint"
                aria-label="Request URL"
                aria-invalid={!urlValidation.valid}
                spellCheck={false}
                className="w-full h-full border-y border-ink/10 bg-ink/[0.03] focus:bg-ink/5 focus:border-accent-blue px-3 py-2.5 text-sm font-mono text-ink placeholder:text-secondary-text/50 focus:outline-none transition-colors"
              />
            </div>
            {builder.sending ? (
              <button
                type="button"
                onClick={builder.cancel}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-r-xl bg-red-400/10 border border-red-400/30 text-red-400 font-bold text-sm hover:bg-red-400/20 transition-colors"
              >
                <X size={15} aria-hidden="true" />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!builder.request.url.trim()}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-r-xl bg-accent-blue text-bg-pure font-bold text-sm hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <SendIcon size={15} aria-hidden="true" />
                Send
              </button>
            )}
          </div>
          {!urlValidation.valid && <p className="text-xs text-red-400 mb-3">{urlValidation.error}</p>}
          {urlValidation.valid && <div className="mb-3" />}

          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setSaveModalOpen(true)} className={smallButtonClass}>
              <Save size={13} aria-hidden="true" />
              {currentSavedId ? `Update "${currentSavedName}"` : 'Save'}
            </button>
            <span className="text-[11px] font-mono text-secondary-text hidden sm:inline">Ctrl/Cmd+Enter to send · Ctrl/Cmd+S to save</span>
          </div>

          {showEmptyState ? (
            <div className="rounded-2xl border border-ink/10 bg-bg-secondary/40 p-6 mb-8">
              <p className="text-sm text-secondary-text mb-4">
                Nothing here yet — enter a URL above, or start from one of these examples (all point at public APIs that allow
                browser requests):
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {EXAMPLE_REQUESTS.map((example) => (
                  <button
                    key={example.name}
                    type="button"
                    onClick={() => handleLoadExample(example.request)}
                    className="text-left p-4 rounded-xl border border-ink/10 hover:border-accent-blue/40 hover:bg-ink/5 transition-colors"
                  >
                    <span className="text-xs font-mono font-bold text-accent-blue">{example.request.method}</span>
                    <p className="text-sm font-medium text-ink mt-1">{example.name}</p>
                    <p className="text-xs text-secondary-text mt-1">{example.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-ink/10 bg-bg-secondary/40 p-4 sm:p-5 mb-6">
                <RequestTabs
                  active={builder.activeTab}
                  onChange={(tab: RequestTab) => builder.setActiveTab(tab)}
                  paramsCount={builder.request.params.filter((p) => p.enabled && p.key.trim()).length}
                  headersCount={builder.request.headers.filter((h) => h.enabled && h.key.trim()).length}
                  bodyActive={builder.request.body.mode !== 'none'}
                  authActive={builder.request.auth.type !== 'none'}
                />

                <div className="pt-4">
                  {builder.activeTab === 'params' && (
                    <div role="tabpanel" id="tabpanel-params" aria-labelledby="tab-params">
                      <KeyValueEditor
                        rows={builder.request.params}
                        onAdd={builder.addParam}
                        onUpdate={builder.updateParam}
                        onRemove={builder.removeParam}
                        addLabel="Add param"
                        emptyLabel="No query parameters yet."
                        rowLabel="param"
                      />
                    </div>
                  )}
                  {builder.activeTab === 'headers' && (
                    <div role="tabpanel" id="tabpanel-headers" aria-labelledby="tab-headers">
                      <KeyValueEditor
                        rows={builder.request.headers}
                        onAdd={builder.addHeader}
                        onUpdate={builder.updateHeader}
                        onRemove={builder.removeHeader}
                        addLabel="Add header"
                        emptyLabel="No custom headers yet."
                        rowLabel="header"
                      />
                    </div>
                  )}
                  {builder.activeTab === 'body' && (
                    <div role="tabpanel" id="tabpanel-body" aria-labelledby="tab-body">
                      <BodyEditor
                        body={builder.request.body}
                        method={builder.request.method}
                        onModeChange={builder.setBodyMode}
                        onRawChange={builder.setBodyRaw}
                        onAddField={builder.addFormField}
                        onUpdateField={builder.updateFormField}
                        onRemoveField={builder.removeFormField}
                      />
                    </div>
                  )}
                  {builder.activeTab === 'auth' && (
                    <div role="tabpanel" id="tabpanel-auth" aria-labelledby="tab-auth">
                      <AuthEditor auth={builder.request.auth} onChange={builder.setAuth} />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-bg-secondary/40 p-4 sm:p-5">
                <h2 className="text-xs font-mono uppercase tracking-widest text-secondary-text mb-4">Response</h2>
                <ResponseViewer
                  sending={builder.sending}
                  response={builder.response}
                  error={builder.error}
                  elapsedMs={builder.elapsedMs}
                  onCancel={builder.cancel}
                />
              </div>
            </>
          )}

          <p className="text-xs text-secondary-text mt-8 leading-relaxed max-w-2xl">
            If a request fails immediately with no response, your browser most likely blocked it because the target API does not
            allow requests from this origin (CORS) — or there's a network issue reaching it. This is a browser/API configuration
            constraint, not a bug in this tool; there is no proxy here to route around it.
          </p>
        </div>
      </main>

      <Footer />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        titleId="request-drawer-heading"
        title={
          <div className="flex items-center gap-1" role="tablist" aria-label="History and saved requests">
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === 'history'}
              onClick={() => setDrawerTab('history')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                drawerTab === 'history' ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary-text hover:text-ink'
              }`}
            >
              History
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === 'saved'}
              onClick={() => setDrawerTab('saved')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                drawerTab === 'saved' ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary-text hover:text-ink'
              }`}
            >
              Saved
            </button>
          </div>
        }
      >
        {drawerTab === 'history' ? (
          <HistoryList entries={history} onLoad={handleLoadHistory} onDelete={handleDeleteHistoryEntry} onClear={handleClearHistory} />
        ) : (
          <SavedRequestsList items={saved} onLoad={handleLoadSaved} onRename={handleRenameSaved} onDelete={handleDeleteSaved} />
        )}
      </Drawer>

      <SaveRequestModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        initialName={currentSavedName || 'Untitled request'}
        onSave={handleSaveRequest}
      />

      <CurlImportModal open={curlModalOpen} onClose={() => setCurlModalOpen(false)} onImport={handleCurlImport} />
    </div>
  );
};
