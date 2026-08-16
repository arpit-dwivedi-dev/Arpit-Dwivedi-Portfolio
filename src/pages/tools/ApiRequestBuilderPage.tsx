import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  BookOpen,
  Check,
  ClipboardPaste,
  Clock,
  Code2,
  Coffee,
  Copy,
  Globe,
  History,
  MoreHorizontal,
  Route,
  Save,
  Send as SendIcon,
  Settings,
  Share2,
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
import { useTheme } from '../../theme/ThemeContext';
import { trackEvent } from '../../monitoring';
import { TOOLS, getToolCategory, categoryTitle, toolTitle } from '../../tools/registry';
import { getGuideBySlug } from '../../content/guides/data';
import { guidePath } from '../../content/guides/categories';
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
  duplicateSavedRequest,
  moveSavedRequest,
  getCorsProxySettings,
  saveCorsProxySettings,
  hasStorableSecrets,
  listEnvironments,
  getActiveEnvironmentId,
  setActiveEnvironmentId,
  upsertEnvironment,
  deleteEnvironment,
  listCollections,
  upsertCollection,
  deleteCollection,
  listFolders,
  upsertFolder,
  deleteFolder,
} from '../../tools/apiRequestBuilder/storage';
import { resolveCustomProxy, type CorsProxySettings } from '../../tools/apiRequestBuilder/corsProxy';
import { CorsProxyModal } from '../../components/tools/apiRequestBuilder/CorsProxyModal';
import { nextId, TIMEOUT_OPTIONS_MS, type ApiRequest, type HistoryEntry, type SavedRequest } from '../../tools/apiRequestBuilder/types';
import {
  createEnvironment,
  extractVariableNames,
  findUnknownVariableNames,
  resolveVariables,
  variablesToMap,
  type Environment,
} from '../../tools/apiRequestBuilder/environment';
import {
  buildCollectionTree,
  canCreateSubfolder,
  collectionContentsSummary,
  createCollection,
  createFolder,
  folderContentsSummary,
  nameCollides,
  type Collection,
  type Folder,
} from '../../tools/apiRequestBuilder/collections';
import { generateCurlCommand } from '../../tools/apiRequestBuilder/curlGenerator';
import { parseCurlCommand } from '../../tools/apiRequestBuilder/curlParser';
import { buildUrlWithParams, decodeUrlComponent, encodeUrlComponent, splitUrlIntoParams, validateUrl } from '../../tools/apiRequestBuilder/urlUtils';
import { buildShareUrl, decodeShareRequest, readShareParam } from '../../tools/apiRequestBuilder/shareRequest';
import { MAX_IMPORT_TEXT_LENGTH, buildExportPayload, parseExportPayload } from '../../tools/apiRequestBuilder/exportFormat';
import { buildImportPlan } from '../../tools/apiRequestBuilder/importFormat';
import { MethodSelect } from '../../components/tools/apiRequestBuilder/MethodSelect';
import { RequestTabs } from '../../components/tools/apiRequestBuilder/RequestTabs';
import { KeyValueEditor } from '../../components/tools/apiRequestBuilder/KeyValueEditor';
import { BodyEditor } from '../../components/tools/apiRequestBuilder/BodyEditor';
import { AuthEditor } from '../../components/tools/apiRequestBuilder/AuthEditor';
import { ResponseViewer } from '../../components/tools/apiRequestBuilder/ResponseViewer';
import { Drawer } from '../../components/tools/apiRequestBuilder/Drawer';
import { HistoryList } from '../../components/tools/apiRequestBuilder/HistoryList';
import { CollectionsBrowser } from '../../components/tools/apiRequestBuilder/CollectionsBrowser';
import { SaveRequestModal } from '../../components/tools/apiRequestBuilder/SaveRequestModal';
import { MoveRequestModal } from '../../components/tools/apiRequestBuilder/MoveRequestModal';
import { CurlImportModal } from '../../components/tools/apiRequestBuilder/CurlImportModal';
import { CodeGenModal } from '../../components/tools/apiRequestBuilder/CodeGenModal';
import { ShareModal } from '../../components/tools/apiRequestBuilder/ShareModal';
import { Modal } from '../../components/tools/apiRequestBuilder/Modal';
import { EnvironmentSelector } from '../../components/tools/apiRequestBuilder/EnvironmentSelector';
import { EnvironmentModal } from '../../components/tools/apiRequestBuilder/EnvironmentModal';
import { smallButtonClass, METHOD_COLORS } from '../../components/tools/apiRequestBuilder/sharedClasses';

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

// 44px min height keeps every row a comfortable thumb target inside the mobile "More" sheet.
const moreMenuItemClass =
  'w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium text-ink hover:bg-ink/5 transition-colors disabled:opacity-40 disabled:pointer-events-none';

type DrawerTab = 'history' | 'saved';

const formatTimeout = (ms: number): string => (ms % 1000 === 0 ? `${ms / 1000}s` : `${ms}ms`);

// A sensible starting point for the Save modal's name field — "GET example.com/users" — rather
// than a placeholder, so most saves need zero typing in the name field at all.
const defaultSaveName = (request: ApiRequest): string => {
  const url = request.url.trim();
  if (!url) return 'Untitled request';
  return `${request.method} ${url.replace(/^https?:\/\//i, '')}`;
};

// Disambiguates a new/renamed collection or folder name against its siblings by appending a
// counter (e.g. "New Folder 2") — simpler and less disruptive than blocking the action outright.
const uniqueSiblingName = (base: string, siblingNames: string[]): string => {
  if (!nameCollides(siblingNames, base)) return base;
  let n = 2;
  while (nameCollides(siblingNames, `${base} ${n}`)) n += 1;
  return `${base} ${n}`;
};

const exportFileName = (collectionName: string): string => {
  const slug = collectionName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug || 'collection'}.101tl-api-requests.json`;
};

/** Triggers a browser "Save As" for locally-generated JSON — no server involved, the file
 *  never leaves the browser except to the user's own disk. */
const downloadJsonFile = (filename: string, data: unknown): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const ApiRequestBuilderPage = () => {
  const { lang, content } = useLanguage();
  const { theme } = useTheme();
  const toolsBase = lang === 'hi' ? '/hi/tools' : '/tools';
  const categoryHref = `${toolsBase}/${TOOL.category}`;

  const builder = useApiRequestBuilder();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedRequest[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('history');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [codeGenModalOpen, setCodeGenModalOpen] = useState(false);
  const [corsProxyModalOpen, setCorsProxyModalOpen] = useState(false);
  const [corsProxySettings, setCorsProxySettings] = useState<CorsProxySettings>(getCorsProxySettings);
  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false);
  const [copiedUpiField, setCopiedUpiField] = useState<'upi' | 'number' | null>(null);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  // Shared by curl-paste feedback, share-link load results, and JSON import results — one
  // generic inline notice rather than three separate near-identical pieces of state.
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<ApiRequest | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>(listEnvironments);
  const [activeEnvironmentId, setActiveEnvironmentIdState] = useState<string | null>(getActiveEnvironmentId);
  const [environmentModalOpen, setEnvironmentModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>(listCollections);
  const [folders, setFolders] = useState<Folder[]>(listFolders);
  const [moveRequestTarget, setMoveRequestTarget] = useState<SavedRequest | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  const handleCopyUpi = (field: 'upi' | 'number', value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedUpiField(field);
    window.setTimeout(() => setCopiedUpiField(null), 1500);
  };

  const showNotice = (tone: 'ok' | 'error', message: string) => {
    setNotice({ tone, message });
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(null), 5000);
  };

  const customProxy = resolveCustomProxy(corsProxySettings);
  // Surfaced to the Credentials setting so an `include` choice can be flagged as unreliable
  // when the request isn't going straight from the browser to the target server.
  const routesThroughProxy = customProxy !== null || corsProxySettings.mode === 'auto';

  const handleCorsProxySettingsChange = (next: CorsProxySettings) => {
    setCorsProxySettings(next);
    saveCorsProxySettings(next);
  };

  const refreshHistory = () => setHistory(listHistory());
  const refreshSaved = () => setSaved(listSavedRequests());
  const refreshEnvironments = () => setEnvironments(listEnvironments());

  // The active environment's variables as a flat key→value map — {} (a no-op for resolution)
  // when "No Environment" is selected, which is what keeps that state byte-for-byte backwards
  // compatible with how the tool behaved before this feature existed.
  const activeEnvironment = activeEnvironmentId ? environments.find((e) => e.id === activeEnvironmentId) ?? null : null;
  const activeVariables = useMemo(() => variablesToMap(activeEnvironment), [activeEnvironment]);

  const handleSelectEnvironment = (id: string | null) => {
    setActiveEnvironmentId(id);
    setActiveEnvironmentIdState(id);
  };

  const handleCreateEnvironment = (): Environment => {
    const created = createEnvironment('New Environment');
    upsertEnvironment(created);
    refreshEnvironments();
    return created;
  };

  const handleChangeEnvironment = (environment: Environment) => {
    upsertEnvironment(environment);
    refreshEnvironments();
  };

  const handleDeleteEnvironment = (id: string) => {
    deleteEnvironment(id);
    refreshEnvironments();
    // deleteEnvironment() already clears the stored active id when it pointed at the one just
    // removed — re-read rather than guess, so this stays correct even if it wasn't the active one.
    setActiveEnvironmentIdState(getActiveEnvironmentId());
  };

  const refreshCollectionsAndFolders = () => {
    setCollections(listCollections());
    setFolders(listFolders());
  };

  const collectionTree = useMemo(() => buildCollectionTree(collections, folders, saved), [collections, folders, saved]);
  const currentSaved = currentSavedId ? saved.find((s) => s.id === currentSavedId) : undefined;

  // A cascade delete (collection/folder) can remove the currently-loaded saved request without
  // going through the single-request delete path — this re-checks against fresh storage rather
  // than assuming, so "Update" never keeps pointing at a record that no longer exists.
  const clearCurrentSavedIfMissing = () => {
    if (currentSavedId && !listSavedRequests().some((s) => s.id === currentSavedId)) setCurrentSavedId(null);
  };

  const handleCreateCollection = () => {
    const name = uniqueSiblingName('New Collection', collections.map((c) => c.name));
    upsertCollection(createCollection(name));
    refreshCollectionsAndFolders();
  };

  const handleRenameCollection = (id: string, name: string) => {
    const collection = collections.find((c) => c.id === id);
    if (!collection) return;
    const siblingNames = collections.filter((c) => c.id !== id).map((c) => c.name);
    upsertCollection({ ...collection, name: uniqueSiblingName(name, siblingNames), updatedAt: Date.now() });
    refreshCollectionsAndFolders();
  };

  const handleDeleteCollection = (id: string) => {
    const collection = collections.find((c) => c.id === id);
    if (!collection) return;
    const { folderCount, requestCount } = collectionContentsSummary(folders, saved, id);
    const scope =
      folderCount === 0 && requestCount === 0
        ? ''
        : ` This deletes ${requestCount} request${requestCount === 1 ? '' : 's'} and ${folderCount} folder${folderCount === 1 ? '' : 's'} inside it.`;
    if (!window.confirm(`Delete collection "${collection.name}"?${scope} This cannot be undone.`)) return;
    deleteCollection(id);
    refreshCollectionsAndFolders();
    refreshSaved();
    clearCurrentSavedIfMissing();
  };

  const handleCreateFolder = (collectionId: string, parentFolderId: string | null) => {
    if (!canCreateSubfolder(folders, parentFolderId)) return;
    const siblingNames = folders
      .filter((f) => f.collectionId === collectionId && f.parentFolderId === parentFolderId)
      .map((f) => f.name);
    upsertFolder(createFolder(collectionId, parentFolderId, uniqueSiblingName('New Folder', siblingNames)));
    refreshCollectionsAndFolders();
  };

  const handleRenameFolder = (id: string, name: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    const siblingNames = folders
      .filter((f) => f.id !== id && f.collectionId === folder.collectionId && f.parentFolderId === folder.parentFolderId)
      .map((f) => f.name);
    upsertFolder({ ...folder, name: uniqueSiblingName(name, siblingNames), updatedAt: Date.now() });
    refreshCollectionsAndFolders();
  };

  const handleDeleteFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    const { folderCount, requestCount } = folderContentsSummary(folders, saved, id);
    const scope =
      folderCount === 0 && requestCount === 0
        ? ''
        : ` This deletes ${requestCount} request${requestCount === 1 ? '' : 's'} and ${folderCount} subfolder${folderCount === 1 ? '' : 's'} inside it.`;
    if (!window.confirm(`Delete folder "${folder.name}"?${scope} This cannot be undone.`)) return;
    deleteFolder(id);
    refreshCollectionsAndFolders();
    refreshSaved();
    clearCurrentSavedIfMissing();
  };

  const handleDuplicateSavedRequest = (id: string) => {
    duplicateSavedRequest(id);
    refreshSaved();
  };

  const handleOpenMoveModal = (item: SavedRequest) => {
    setMoveRequestTarget(item);
    setMoveModalOpen(true);
  };

  const handleMoveSavedRequest = (id: string, collectionId: string, folderId: string | null) => {
    moveSavedRequest(id, collectionId, folderId);
    refreshSaved();
  };

  const handleShareCurrentRequest = () => {
    setShareTarget(builder.request);
    setShareModalOpen(true);
  };

  // Sharing a saved/collection request shares only that one request — never the collection
  // name, folder path, or any other request alongside it (see PART 11/12).
  const handleShareSavedRequest = (item: SavedRequest) => {
    setShareTarget(item.request);
    setShareModalOpen(true);
  };

  const handleExportCollection = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    const payload = buildExportPayload([collectionId], collections, folders, saved);
    downloadJsonFile(exportFileName(collection.name), payload);
  };

  const handleImportFile = async (file: File) => {
    if (file.size > MAX_IMPORT_TEXT_LENGTH) {
      showNotice('error', `That file is too large to import (limit ${Math.floor(MAX_IMPORT_TEXT_LENGTH / 1_000_000)}MB).`);
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      showNotice('error', "Couldn't read that file.");
      return;
    }

    const parsed = parseExportPayload(text);
    if (!parsed.ok) {
      showNotice('error', parsed.error);
      return;
    }

    const plan = buildImportPlan(parsed.result.payload, collections.map((c) => c.name));
    if (plan.collections.length === 0) {
      showNotice('error', 'Nothing importable was found in that file.');
      return;
    }

    for (const collection of plan.collections) upsertCollection(collection);
    for (const folder of plan.folders) upsertFolder(folder);
    for (const request of plan.requests) upsertSavedRequest(request);
    refreshCollectionsAndFolders();
    refreshSaved();

    const totalSkipped = parsed.result.skipped.folders + parsed.result.skipped.requests + plan.skipped.folders + plan.skipped.requests;
    const skipSuffix = totalSkipped > 0 ? ` (${totalSkipped} item${totalSkipped === 1 ? '' : 's'} skipped as invalid)` : '';
    showNotice(
      'ok',
      `Imported "${plan.collections[0].name}" — ${plan.folders.length} folder${plan.folders.length === 1 ? '' : 's'}, ${plan.requests.length} request${plan.requests.length === 1 ? '' : 's'}${skipSuffix}.`,
    );
  };

  useEffect(() => () => {
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
  }, []);

  useEffect(() => {
    refreshHistory();
    refreshSaved();
    trackEvent('tool_view', { tool: 'api-request-builder' });

    // Opening a share link populates the editor with the decoded request and nothing else —
    // no auto-send, no overwriting saved requests/environments/collections (see PART 8). The
    // query param is then stripped via replaceState so a page refresh doesn't keep reloading
    // the same shared request over whatever the user has since typed.
    const shareParam = readShareParam(window.location.search);
    if (shareParam) {
      const decoded = decodeShareRequest(shareParam);
      if (decoded.ok) {
        builder.loadRequest(decoded.request);
        setCurrentSavedId(null);
        showNotice('ok', 'Imported request from a share link — secrets were not included, and nothing has been saved or sent.');
      } else {
        showNotice('error', decoded.error);
      }
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('request');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        void builder.send(corsProxySettings, activeVariables).then(refreshHistory);
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
  }, [builder.send, corsProxySettings, activeVariables]);

  const handleSend = () => {
    void builder.send(corsProxySettings, activeVariables).then(refreshHistory);
  };

  // Jumps to the on-page Guides list rather than deep-linking straight into a
  // single article — there are multiple related guides, so this lets the
  // reader pick instead of always landing in "How to Test an API".
  const scrollToGuides = () => {
    document.getElementById('related-guides')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        showNotice(
          'ok',
          result.warnings.length > 0
            ? `Imported from pasted curl command — ${result.warnings.join(' ')}`
            : 'Imported method, headers, body, and auth from the pasted curl command.',
        );
      } else {
        showNotice('error', result.error ?? "Couldn't parse that as a curl command.");
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

  const handleSaveRequest = (name: string, collectionId: string, folderId: string | null) => {
    const existing = currentSavedId ? saved.find((s) => s.id === currentSavedId) : undefined;
    const record: SavedRequest = {
      id: existing?.id ?? nextId(),
      collectionId,
      folderId,
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
      await navigator.clipboard.writeText(generateCurlCommand(builder.request, activeVariables));
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

  // Validated against the environment-resolved URL, not the raw template — so a URL like
  // `{{baseUrl}}/users` reads as valid once an environment actually defines `baseUrl`, instead of
  // permanently failing `new URL()` parsing the way the literal `{{baseUrl}}/users` text would.
  const resolvedUrlPreview = resolveVariables(builder.request.url, activeVariables);
  const urlHasUnknownVariable = extractVariableNames(resolvedUrlPreview).length > 0;
  const urlValidation = builder.request.url.trim() ? validateUrl(resolvedUrlPreview) : { valid: true as const };
  // Referenced anywhere in the request (url, params, headers, auth, body) but not defined in the
  // active environment — surfaced as a single non-blocking notice rather than per-tab, per Part 9's
  // "make unknown variables understandable" without needing a per-field indicator.
  const unknownVariables = findUnknownVariableNames(builder.request, activeVariables);
  const showEmptyState = builder.request.url.trim() === '';
  const currentSavedName = currentSaved?.name ?? '';
  const saveModalDefaultCollectionId = currentSaved?.collectionId ?? collections[0]?.id ?? '';
  const saveModalDefaultFolderId = currentSaved?.folderId ?? null;

  let requestNotice: ReactNode;
  if (!urlValidation.valid && !urlHasUnknownVariable) {
    requestNotice = <p className="text-xs text-red-400 mb-3">{urlValidation.error}</p>;
  } else if (notice) {
    // A one-time, auto-clearing notice (curl paste, share-link load, JSON import result) takes
    // priority over the persistent "unknown variable" warning below — otherwise loading a share
    // link that references `{{baseUrl}}` (the whole point of sharing) would always immediately
    // bury its own "imported from share link" confirmation under that warning.
    requestNotice = <p className={`text-xs mb-3 ${notice.tone === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{notice.message}</p>;
  } else if (unknownVariables.length > 0) {
    requestNotice = (
      <p className="text-xs text-amber-400 mb-3">
        Unknown variable{unknownVariables.length > 1 ? 's' : ''}: {unknownVariables.map((name) => `{{${name}}}`).join(', ')}
        {activeEnvironment ? ` — not set in "${activeEnvironment.name}".` : ' — no environment selected.'}
      </p>
    );
  } else {
    requestNotice = <div className="mb-3" />;
  }

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

      <main id="main-content" className="pt-28 pb-24 sm:pb-16">
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

          {/* Method + URL + Send — the tool itself, front and center before any notes.
              On mobile the URL input needs the full row to itself (it's the primary
              input of the whole tool) so method/send/coffee drop to a second line
              below it via flex-wrap + order; on sm+ they're one unbroken bar again. */}
          <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-x-0 gap-y-2 sm:gap-y-0 mb-1">
            <div className="order-2 sm:order-none">
              <MethodSelect value={builder.request.method} onChange={builder.setMethod} />
            </div>
            <div className="order-1 sm:order-none basis-full sm:basis-auto sm:flex-1 relative">
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
                className="w-full h-full rounded-xl border border-ink/10 sm:rounded-none sm:border-y sm:border-x-0 bg-ink/[0.03] focus:bg-ink/5 focus:border-accent-blue px-3 py-2.5 text-sm font-mono text-ink placeholder:text-secondary-text/50 focus:outline-none transition-colors"
              />
            </div>
            {builder.sending ? (
              <button
                type="button"
                onClick={builder.cancel}
                className="order-3 sm:order-none flex-1 sm:flex-initial justify-center shrink-0 flex items-center gap-2 px-5 py-2.5 border border-red-400/30 bg-red-400/10 text-red-400 font-bold text-sm hover:bg-red-400/20 transition-colors"
              >
                <X size={15} aria-hidden="true" />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!builder.request.url.trim()}
                className="order-3 sm:order-none flex-1 sm:flex-initial justify-center shrink-0 flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-bg-pure font-bold text-sm hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
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
              className="order-4 sm:order-none shrink-0 flex items-center px-3 rounded-r-xl border-y border-r border-[#FFDD00]/30 bg-[#FFDD00]/10 text-[#FFDD00] hover:bg-[#FFDD00]/20 transition-colors"
            >
              <Coffee size={16} aria-hidden="true" />
            </button>
          </div>
          {requestNotice}

          <div className="hidden sm:flex items-center justify-between mb-3">
            <button type="button" onClick={() => setSaveModalOpen(true)} className={smallButtonClass}>
              <Save size={13} aria-hidden="true" />
              {currentSavedId ? `Update "${currentSavedName}"` : 'Save'}
            </button>
            <span className="text-[11px] font-mono text-secondary-text hidden sm:inline">Ctrl/Cmd+Enter to send · Ctrl/Cmd+S to save</span>
          </div>

          {/* Toolbar (desktop) — every action gets its own visible button. */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3">
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
            <button type="button" onClick={() => setCodeGenModalOpen(true)} className={smallButtonClass}>
              <Code2 size={13} aria-hidden="true" />
              Code
            </button>
            <button type="button" onClick={handleShareCurrentRequest} disabled={!builder.request.url.trim()} className={smallButtonClass}>
              <Share2 size={13} aria-hidden="true" />
              Share
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
            <EnvironmentSelector
              environments={environments}
              activeEnvironmentId={activeEnvironmentId}
              onSelect={handleSelectEnvironment}
              onManage={() => setEnvironmentModalOpen(true)}
              theme={theme}
            />
            <button
              type="button"
              onClick={() => setCorsProxyModalOpen(true)}
              className={`${smallButtonClass} ${customProxy ? '!border-amber-400/40 !text-amber-400' : ''}`}
            >
              <Route size={13} aria-hidden="true" />
              CORS Proxy
              {customProxy ? ': On' : corsProxySettings.mode === 'auto' ? ': Auto' : ': Off'}
            </button>
            <label className={`${smallButtonClass} cursor-pointer`} title="Request timeout — how long to wait before the request is automatically cancelled.">
              <Clock size={13} aria-hidden="true" />
              <select
                value={builder.request.timeoutMs}
                onChange={(e) => builder.setTimeoutMs(Number(e.target.value))}
                aria-label="Request timeout"
                style={{ colorScheme: theme }}
                className="bg-transparent border-none text-xs font-mono font-medium focus:outline-none cursor-pointer appearance-none"
              >
                {TIMEOUT_OPTIONS_MS.map((ms) => (
                  <option key={ms} value={ms}>
                    Timeout: {formatTimeout(ms)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={scrollToGuides} className={smallButtonClass}>
              <BookOpen size={13} aria-hidden="true" />
              Guides
            </button>
          </div>

          {/* Toolbar (mobile) — only the actions people reach for on every request stay
              on screen; everything else lives one tap away in the "More" sheet so a
              first-time visitor hits Params/Headers/Body without scrolling past nine
              buttons first. */}
          <div className="flex sm:hidden items-center gap-2 mb-3">
            <button type="button" onClick={() => setSaveModalOpen(true)} className={smallButtonClass}>
              <Save size={13} aria-hidden="true" />
              {currentSavedId ? 'Update' : 'Save'}
            </button>
            <button type="button" onClick={() => { setDrawerTab('history'); setDrawerOpen(true); }} className={smallButtonClass}>
              <History size={13} aria-hidden="true" />
              History
            </button>
            <button type="button" onClick={handleClearRequest} className={smallButtonClass}>
              <Trash2 size={13} aria-hidden="true" />
              Clear
            </button>
            <button type="button" onClick={() => setMoreMenuOpen(true)} className={`${smallButtonClass} ml-auto`}>
              <MoreHorizontal size={13} aria-hidden="true" />
              More
            </button>
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
              <div className="rounded-2xl border border-ink/10 bg-bg-secondary/40 p-3 sm:p-5 mb-6">
                <RequestTabs
                  active={builder.activeTab}
                  onChange={(tab: RequestTab) => builder.setActiveTab(tab)}
                  paramsCount={builder.request.params.filter((p) => p.enabled && p.key.trim()).length}
                  headersCount={builder.request.headers.filter((h) => h.enabled && h.key.trim()).length}
                  bodyActive={builder.request.body.mode !== 'none'}
                  authActive={builder.request.auth.type !== 'none' || builder.request.credentials !== 'same-origin'}
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
                      <AuthEditor
                        auth={builder.request.auth}
                        onChange={builder.setAuth}
                        credentials={builder.request.credentials}
                        onCredentialsChange={builder.setCredentials}
                        headers={builder.request.headers}
                        routesThroughProxy={routesThroughProxy}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-bg-secondary/40 p-3 sm:p-5">
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

          {/* Mobile-only floating action bar — testing a request means scrolling down
              past Params/Response, so Send needs to stay reachable without a trip
              back to the top every time. Desktop already has Send in view at all times. */}
          {!showEmptyState && (
            // right-20 rather than right-3 — the site-wide WhatsApp/chat launchers are
            // fixed at bottom-right (see WhatsAppButton.tsx, ChatBot.tsx), and a full-width
            // bar would otherwise render its Send button right underneath them.
            <div className="sm:hidden fixed bottom-3 left-3 right-20 z-40 flex items-center gap-2 rounded-2xl border border-ink/10 bg-bg-secondary/95 backdrop-blur-md shadow-2xl px-3 py-2">
              <span className={`shrink-0 font-mono text-xs font-bold ${METHOD_COLORS[builder.request.method]}`}>
                {builder.request.method}
              </span>
              <span className="flex-1 min-w-0 truncate font-mono text-xs text-secondary-text">
                {builder.request.url || 'No URL set'}
              </span>
              {builder.sending ? (
                <button
                  type="button"
                  onClick={builder.cancel}
                  className="shrink-0 flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-red-400/30 bg-red-400/10 text-red-400 font-bold text-xs hover:bg-red-400/20 transition-colors"
                >
                  <X size={14} aria-hidden="true" />
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!builder.request.url.trim()}
                  className="shrink-0 flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-accent-blue text-bg-pure font-bold text-xs hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <SendIcon size={14} aria-hidden="true" />
                  Send
                </button>
              )}
            </div>
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
            <div id="related-guides" className="mt-10 pt-8 border-t border-ink/10 scroll-mt-24">
              <h2 className="text-lg font-bold text-ink mb-4">Guides</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {RELATED_GUIDES.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      to={guidePath(guide)}
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
          <CollectionsBrowser
            tree={collectionTree}
            folders={folders}
            onOpenRequest={handleLoadSaved}
            onCreateCollection={handleCreateCollection}
            onRenameCollection={handleRenameCollection}
            onDeleteCollection={handleDeleteCollection}
            onExportCollection={handleExportCollection}
            onImportFile={(file) => void handleImportFile(file)}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onRenameRequest={handleRenameSaved}
            onDuplicateRequest={handleDuplicateSavedRequest}
            onMoveRequest={handleOpenMoveModal}
            onShareRequest={handleShareSavedRequest}
            onDeleteRequest={handleDeleteSaved}
          />
        )}
      </Drawer>

      {/* Mobile-only overflow sheet for the toolbar actions that don't need to be
          one tap away — same handlers as the desktop buttons, just closes itself
          after firing so the sheet doesn't linger over the result of the action. */}
      <Drawer open={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} titleId="more-actions-heading" title="More actions">
        <div className="p-2">
          <button
            type="button"
            onClick={() => { setDrawerTab('saved'); setMoreMenuOpen(false); setDrawerOpen(true); }}
            className={moreMenuItemClass}
          >
            <Star size={16} aria-hidden="true" />
            Saved requests
          </button>
          <button
            type="button"
            onClick={() => { setCurlModalOpen(true); setMoreMenuOpen(false); }}
            className={moreMenuItemClass}
          >
            <ClipboardPaste size={16} aria-hidden="true" />
            Import cURL
          </button>
          <button
            type="button"
            onClick={() => { void handleCopyCurl(); setMoreMenuOpen(false); }}
            className={moreMenuItemClass}
          >
            <Terminal size={16} aria-hidden="true" />
            Copy as cURL
          </button>
          <button
            type="button"
            onClick={() => { setCodeGenModalOpen(true); setMoreMenuOpen(false); }}
            className={moreMenuItemClass}
          >
            <Code2 size={16} aria-hidden="true" />
            Generate code
          </button>
          <button
            type="button"
            onClick={() => { handleShareCurrentRequest(); setMoreMenuOpen(false); }}
            disabled={!builder.request.url.trim()}
            className={moreMenuItemClass}
          >
            <Share2 size={16} aria-hidden="true" />
            Share request
          </button>
          <button
            type="button"
            onClick={() => { void handleCopyUrl(); setMoreMenuOpen(false); }}
            disabled={!builder.request.url.trim()}
            className={moreMenuItemClass}
          >
            <Copy size={16} aria-hidden="true" />
            Copy URL
          </button>
          <button
            type="button"
            onClick={() => { builder.setUrl(encodeUrlComponent(builder.request.url)); setMoreMenuOpen(false); }}
            disabled={!builder.request.url.trim()}
            className={moreMenuItemClass}
          >
            <span className="w-4 text-center text-xs font-mono" aria-hidden="true">%</span>
            Encode URL
          </button>
          <button
            type="button"
            onClick={() => { builder.setUrl(decodeUrlComponent(builder.request.url)); setMoreMenuOpen(false); }}
            disabled={!builder.request.url.trim()}
            className={moreMenuItemClass}
          >
            <span className="w-4 text-center text-xs font-mono" aria-hidden="true">%</span>
            Decode URL
          </button>
          <label className={`${moreMenuItemClass} cursor-pointer`}>
            <Globe size={16} aria-hidden="true" />
            Environment
            <select
              value={activeEnvironmentId ?? ''}
              onChange={(e) => handleSelectEnvironment(e.target.value || null)}
              aria-label="Active environment"
              style={{ colorScheme: theme }}
              className="ml-auto bg-ink/5 border border-ink/10 rounded-lg px-2 py-1 text-xs font-mono text-secondary-text focus:outline-none focus:border-accent-blue max-w-[110px]"
            >
              <option value="">No Environment</option>
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => { setEnvironmentModalOpen(true); setMoreMenuOpen(false); }}
            className={moreMenuItemClass}
          >
            <Settings size={16} aria-hidden="true" />
            Manage environments
          </button>
          <button
            type="button"
            onClick={() => { setCorsProxyModalOpen(true); setMoreMenuOpen(false); }}
            className={moreMenuItemClass}
          >
            <Route size={16} aria-hidden="true" className={customProxy ? 'text-amber-400' : ''} />
            CORS Proxy
            <span className={`ml-auto text-xs font-mono ${customProxy ? 'text-amber-400' : 'text-secondary-text'}`}>
              {customProxy ? 'On' : corsProxySettings.mode === 'auto' ? 'Auto' : 'Off'}
            </span>
          </button>
          <label className={`${moreMenuItemClass} cursor-pointer`}>
            <Clock size={16} aria-hidden="true" />
            Timeout
            <select
              value={builder.request.timeoutMs}
              onChange={(e) => builder.setTimeoutMs(Number(e.target.value))}
              aria-label="Request timeout"
              style={{ colorScheme: theme }}
              className="ml-auto bg-ink/5 border border-ink/10 rounded-lg px-2 py-1 text-xs font-mono text-secondary-text focus:outline-none focus:border-accent-blue"
            >
              {TIMEOUT_OPTIONS_MS.map((ms) => (
                <option key={ms} value={ms}>
                  {formatTimeout(ms)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => { setMoreMenuOpen(false); scrollToGuides(); }}
            className={moreMenuItemClass}
          >
            <BookOpen size={16} aria-hidden="true" />
            Guides
          </button>
        </div>
      </Drawer>

      <SaveRequestModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        initialName={currentSavedName || defaultSaveName(builder.request)}
        onSave={handleSaveRequest}
        hasSecrets={hasStorableSecrets(builder.request)}
        collections={collections}
        folders={folders}
        defaultCollectionId={saveModalDefaultCollectionId}
        defaultFolderId={saveModalDefaultFolderId}
      />

      <MoveRequestModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        request={moveRequestTarget}
        collections={collections}
        folders={folders}
        onMove={handleMoveSavedRequest}
      />

      <CurlImportModal open={curlModalOpen} onClose={() => setCurlModalOpen(false)} onImport={handleCurlImport} />

      <CodeGenModal
        open={codeGenModalOpen}
        onClose={() => setCodeGenModalOpen(false)}
        request={builder.request}
        variables={activeVariables}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        request={shareTarget}
        baseUrl={`${window.location.origin}${window.location.pathname}`}
      />

      <CorsProxyModal
        open={corsProxyModalOpen}
        onClose={() => setCorsProxyModalOpen(false)}
        settings={corsProxySettings}
        onChange={handleCorsProxySettingsChange}
      />

      <EnvironmentModal
        open={environmentModalOpen}
        onClose={() => setEnvironmentModalOpen(false)}
        environments={environments}
        onCreate={handleCreateEnvironment}
        onChange={handleChangeEnvironment}
        onDelete={handleDeleteEnvironment}
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
