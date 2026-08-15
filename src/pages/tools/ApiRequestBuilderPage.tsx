import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  BookOpen,
  Check,
  ClipboardPaste,
  Coffee,
  Copy,
  History,
  Route,
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
import { getGuideBySlug } from '../../content/guides/data';
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
  getCorsProxySettings,
  saveCorsProxySettings,
} from '../../tools/apiRequestBuilder/storage';
import { resolveCustomProxy, type CorsProxySettings } from '../../tools/apiRequestBuilder/corsProxy';
import { CorsProxyModal } from '../../components/tools/apiRequestBuilder/CorsProxyModal';
import { nextId, type ApiRequest, type HistoryEntry, type SavedRequest } from '../../tools/apiRequestBuilder/types';
import { generateCurlCommand } from '../../tools/apiRequestBuilder/curlGenerator';
import { parseCurlCommand } from '../../tools/apiRequestBuilder/curlParser';
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
import { Modal } from '../../components/tools/apiRequestBuilder/Modal';
import { smallButtonClass } from '../../components/tools/apiRequestBuilder/sharedClasses';

const TOOL = TOOLS.find((t) => t.id === 'api-request-builder')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const SITE_ORIGIN = 'https://101techlabs.com';

const RELATED_GUIDE_SLUGS = ['how-to-test-an-api', 'what-is-a-cors-error'] as const;
const RELATED_GUIDES = RELATED_GUIDE_SLUGS.map((slug) => getGuideBySlug(slug)!).filter(Boolean);

// Same UPI details used on the other free-tool pages (QR Code Generator, Invoice
// Generator) — duplicated per-page rather than shared, matching that convention.
const UPI_ID = 'marpit697.ad@ybl';
const UPI_NUMBER = '7071520965';
const UPI_PAYEE_NAME = 'Arpit Dwivedi';
const UPI_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&cu=INR`;

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
  const [corsProxyModalOpen, setCorsProxyModalOpen] = useState(false);
  const [corsProxySettings, setCorsProxySettings] = useState<CorsProxySettings>(getCorsProxySettings);
  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false);
  const [copiedUpiField, setCopiedUpiField] = useState<'upi' | 'number' | null>(null);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const pasteNoticeTimeoutRef = useRef<number | null>(null);

  const handleCopyUpi = (field: 'upi' | 'number', value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedUpiField(field);
    window.setTimeout(() => setCopiedUpiField(null), 1500);
  };

  const showPasteNotice = (tone: 'ok' | 'error', message: string) => {
    setPasteNotice({ tone, message });
    if (pasteNoticeTimeoutRef.current) window.clearTimeout(pasteNoticeTimeoutRef.current);
    pasteNoticeTimeoutRef.current = window.setTimeout(() => setPasteNotice(null), 5000);
  };

  const customProxy = resolveCustomProxy(corsProxySettings);

  const handleCorsProxySettingsChange = (next: CorsProxySettings) => {
    setCorsProxySettings(next);
    saveCorsProxySettings(next);
  };

  const refreshHistory = () => setHistory(listHistory());
  const refreshSaved = () => setSaved(listSavedRequests());

  useEffect(() => () => {
    if (pasteNoticeTimeoutRef.current) window.clearTimeout(pasteNoticeTimeoutRef.current);
  }, []);

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
        void builder.send(corsProxySettings).then(refreshHistory);
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
  }, [builder.send, corsProxySettings]);

  const handleSend = () => {
    void builder.send(corsProxySettings).then(refreshHistory);
  };

  const handleUrlPaste = (e: { clipboardData: DataTransfer; preventDefault: () => void }) => {
    const pasted = e.clipboardData.getData('text');
    const trimmed = pasted.trim();

    // Pasting a whole curl command into the URL bar sets up the entire request —
    // method, headers, body, auth — not just the URL, same as the Import cURL modal.
    if (/^curl\s/i.test(trimmed)) {
      e.preventDefault();
      const result = parseCurlCommand(trimmed);
      if (result.ok && result.request) {
        handleCurlImport(result.request);
        showPasteNotice(
          'ok',
          result.warnings.length > 0
            ? `Imported from pasted curl command — ${result.warnings.join(' ')}`
            : 'Imported method, headers, body, and auth from the pasted curl command.',
        );
      } else {
        showPasteNotice('error', result.error ?? "Couldn't parse that as a curl command.");
      }
      return;
    }

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

          {/* Method + URL + Send — the tool itself, front and center before any notes */}
          <div className="flex items-stretch mb-1">
            <MethodSelect value={builder.request.method} onChange={builder.setMethod} />
            <div className="flex-1 relative">
              <input
                ref={urlInputRef}
                type="text"
                value={builder.request.url}
                onChange={(e) => builder.setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                placeholder="https://api.example.com/endpoint — or paste a curl command"
                title="You can also paste a full curl command here to import method, headers, body, and auth all at once."
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
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 border border-red-400/30 bg-red-400/10 text-red-400 font-bold text-sm hover:bg-red-400/20 transition-colors"
              >
                <X size={15} aria-hidden="true" />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!builder.request.url.trim()}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-bg-pure font-bold text-sm hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <SendIcon size={15} aria-hidden="true" />
                Send
              </button>
            )}
            <button
              type="button"
              onClick={() => setCoffeeModalOpen(true)}
              title="Buy me a coffee"
              aria-label="Buy me a coffee"
              className="shrink-0 flex items-center px-3 rounded-r-xl border-y border-r border-[#FFDD00]/30 bg-[#FFDD00]/10 text-[#FFDD00] hover:bg-[#FFDD00]/20 transition-colors"
            >
              <Coffee size={16} aria-hidden="true" />
            </button>
          </div>
          {!urlValidation.valid && <p className="text-xs text-red-400 mb-3">{urlValidation.error}</p>}
          {urlValidation.valid && pasteNotice && (
            <p className={`text-xs mb-3 ${pasteNotice.tone === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{pasteNotice.message}</p>
          )}
          {urlValidation.valid && !pasteNotice && <div className="mb-3" />}

          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setSaveModalOpen(true)} className={smallButtonClass}>
              <Save size={13} aria-hidden="true" />
              {currentSavedId ? `Update "${currentSavedName}"` : 'Save'}
            </button>
            <span className="text-[11px] font-mono text-secondary-text hidden sm:inline">Ctrl/Cmd+Enter to send · Ctrl/Cmd+S to save</span>
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
            <button
              type="button"
              onClick={() => setCorsProxyModalOpen(true)}
              className={`${smallButtonClass} ${customProxy ? '!border-amber-400/40 !text-amber-400' : ''}`}
            >
              <Route size={13} aria-hidden="true" />
              CORS Proxy
              {customProxy ? ': On' : corsProxySettings.mode === 'auto' ? ': Auto' : ': Off'}
            </button>
            <Link to={lang === 'hi' ? '/hi' : '/guides/how-to-test-an-api'} className={smallButtonClass}>
              <BookOpen size={13} aria-hidden="true" />
              Guide
            </Link>
          </div>

          {/* Trust/status notes — kept short and below the tool itself, not ahead of it. */}
          <p className="text-xs text-secondary-text mb-4 leading-snug">
            <ShieldCheck size={12} className="inline -mt-0.5 mr-1 text-accent-blue" aria-hidden="true" />
            Sent directly from your browser via <code className="font-mono text-ink">fetch()</code> — nothing passes through our
            servers; history/saved requests stay in local storage.
            {customProxy && (
              <>
                {' '}
                <span className="text-amber-400/90">
                  <Route size={12} className="inline -mt-0.5 mr-1" aria-hidden="true" />
                  CORS proxy active — every request currently routes through <code className="font-mono">{customProxy.origin}</code>.{' '}
                  <button type="button" onClick={() => setCorsProxyModalOpen(true)} className="underline hover:text-amber-300">
                    Change
                  </button>
                </span>
              </>
            )}
          </p>

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
                  viaProxy={builder.viaProxy}
                  onCancel={builder.cancel}
                />
              </div>
            </>
          )}

          <p className="text-xs text-secondary-text mt-8 leading-relaxed max-w-2xl">
            If a request fails immediately with no response, your browser most likely blocked it because the target API does not
            allow requests from this origin (CORS) — or there's a network issue reaching it. This is a browser/API configuration
            constraint, not a bug in this tool. By default nothing routes around it — you can opt into a{' '}
            <button type="button" onClick={() => setCorsProxyModalOpen(true)} className="underline hover:text-ink">
              CORS proxy
            </button>{' '}
            from the toolbar above, which sends the request through a server you choose instead of directly from your browser.
          </p>

          {RELATED_GUIDES.length > 0 && (
            <div className="mt-10 pt-8 border-t border-ink/10">
              <h2 className="text-lg font-bold text-ink mb-4">Guides</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {RELATED_GUIDES.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      to={`/guides/${guide.slug}`}
                      className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                    >
                      <span className="font-bold text-ink">{guide.title}</span>
                      <p className="text-secondary-text text-sm mt-1">{guide.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

      <CorsProxyModal
        open={corsProxyModalOpen}
        onClose={() => setCorsProxyModalOpen(false)}
        settings={corsProxySettings}
        onChange={handleCorsProxySettingsChange}
      />

      <Modal
        open={coffeeModalOpen}
        onClose={() => setCoffeeModalOpen(false)}
        titleId="api-builder-upi-heading"
        title={
          <span className="flex items-center gap-2">
            <Coffee size={18} className="text-[#FFDD00]" aria-hidden="true" />
            Buy me a coffee
          </span>
        }
        maxWidthClassName="max-w-sm"
      >
        <p className="text-sm text-secondary-text mb-4">
          This tool is free, with no signup and no ads gating it. If it saved you time, a coffee is always appreciated.
        </p>

        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-2xl bg-white">
            <QRCodeSVG value={UPI_LINK} size={180} bgColor="#ffffff" fgColor="#000000" level="M" includeMargin={false} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/5">
            <div className="min-w-0">
              <p className="text-xs font-mono text-secondary-text">UPI ID</p>
              <p className="text-sm font-bold text-ink truncate">{UPI_ID}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyUpi('upi', UPI_ID)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-all"
            >
              {copiedUpiField === 'upi' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copiedUpiField === 'upi' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/5">
            <div className="min-w-0">
              <p className="text-xs font-mono text-secondary-text">UPI Number</p>
              <p className="text-sm font-bold text-ink truncate">{UPI_NUMBER}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyUpi('number', UPI_NUMBER)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-all"
            >
              {copiedUpiField === 'number' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copiedUpiField === 'number' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
