import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  Copy,
  Download,
  FileCode2,
  FolderOpen,
  ImageDown,
  LayoutTemplate,
  Link2,
  Maximize2,
  Moon,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { Header } from './Header';
import { SplitPane } from './SplitPane';
import { EditorPanel } from './EditorPanel';
import { DiagramCanvas, type DiagramFocusRequest } from './DiagramCanvas';
import { StatusBar } from './StatusBar';
import { MobileTabs } from './MobileTabs';
import { DocumentsModal } from './DocumentsModal';
import { TemplatesModal } from './TemplatesModal';
import { ShareModal } from './ShareModal';
import { HelpModal } from './HelpModal';
import { RecordsModal } from './RecordsModal';
import { TableSettingsModal } from './TableSettingsModal';
import { ConfirmDialog } from './ConfirmDialog';
import { CommandPalette, type Command } from './CommandPalette';
import { TableSearchPalette } from './TableSearchPalette';
import type { TableActions } from './TableActionsContext';
import type { FocusTarget } from '../../../tools/dbmlDiagramBuilder/search/schemaSearch';
import { DbmlThemeProvider } from './DbmlThemeContext';
import { cycleDbmlTheme } from '../../../tools/dbmlDiagramBuilder/theme/resolveTheme';
import { findTableNameRanges } from '../../../tools/dbmlDiagramBuilder/edit/renameTable';
import { useDbmlWorkspace } from '../../../tools/dbmlDiagramBuilder/state/useDbmlWorkspace';
import { useMediaQuery } from '../../../tools/dbmlDiagramBuilder/hooks/useMediaQuery';
import { downloadTextFile } from '../../../tools/dbmlDiagramBuilder/export/download';
import { copyDbmlToClipboard } from '../../../tools/dbmlDiagramBuilder/export/copyToClipboard';
import { exportDiagramAsPng, exportDiagramAsSvg } from '../../../tools/dbmlDiagramBuilder/export/exportDiagram';
import type { DbmlTemplate } from '../../../tools/dbmlDiagramBuilder/sampleTemplates';

type ModalKind = 'documents' | 'templates' | 'share' | 'help' | null;

interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function DbmlDiagramBuilderApp() {
  const workspace = useDbmlWorkspace();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [mobileTab, setMobileTab] = useState<'editor' | 'diagram'>('editor');
  const [modal, setModal] = useState<ModalKind>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<DiagramFocusRequest | null>(null);
  const focusRequestSeq = useRef(0);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [revealLine, setRevealLine] = useState<number | null>(null);
  const [copyDbmlStatus, setCopyDbmlStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyDbmlTimeoutRef = useRef<number | null>(null);
  // Which table's header button was clicked (by its parser-assigned id, not
  // its display name — two tables in different schemas can share a name),
  // and which dialog it opened.
  const [recordsTableId, setRecordsTableId] = useState<string | null>(null);
  const [settingsTableId, setSettingsTableId] = useState<string | null>(null);

  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRevealLine(workspace.errorLine), [workspace.errorLine]);

  const fileSafeName = (workspace.activeDocument?.name ?? 'diagram').trim().replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '-') || 'diagram';

  const applyTextWithConfirmIfNeeded = useCallback(
    (text: string, opts?: { resetPositions?: boolean }) => {
      if (workspace.dbmlText.trim().length > 0) {
        setPendingConfirm({
          title: 'Replace current DBML?',
          message: "This will replace the editor's current content. This can't be undone.",
          confirmLabel: 'Replace',
          danger: true,
          onConfirm: () => workspace.loadDbmlIntoActiveDocument(text, opts),
        });
      } else {
        workspace.loadDbmlIntoActiveDocument(text, opts);
      }
    },
    [workspace],
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      applyTextWithConfirmIfNeeded(text, { resetPositions: true });
    },
    [applyTextWithConfirmIfNeeded],
  );

  const handlePickTemplate = useCallback(
    (template: DbmlTemplate) => {
      setModal(null);
      applyTextWithConfirmIfNeeded(template.dbml, { resetPositions: true });
    },
    [applyTextWithConfirmIfNeeded],
  );

  const handleExportDbml = useCallback(() => {
    downloadTextFile(`${fileSafeName}.dbml`, workspace.dbmlText, 'text/plain');
  }, [fileSafeName, workspace.dbmlText]);

  const handleCopyDbml = useCallback(async () => {
    const ok = await copyDbmlToClipboard(workspace.dbmlText);
    setCopyDbmlStatus(ok ? 'copied' : 'error');
    if (copyDbmlTimeoutRef.current) window.clearTimeout(copyDbmlTimeoutRef.current);
    copyDbmlTimeoutRef.current = window.setTimeout(() => setCopyDbmlStatus('idle'), 2000);
  }, [workspace.dbmlText]);

  useEffect(() => () => {
    if (copyDbmlTimeoutRef.current) window.clearTimeout(copyDbmlTimeoutRef.current);
  }, []);

  // PNG/SVG export screenshots the live canvas DOM, and on mobile that canvas
  // is `display: none` behind the Editor tab — with no box to capture, the
  // export comes out blank. Switch to the Diagram tab and wait for it to be
  // fully drawn: a size alone is not enough, because React Flow can only route
  // its edges once the revealed canvas has measured the nodes, and capturing
  // in that gap exports the tables with none of the relationship lines.
  const expectedEdgeCount = workspace.edges.length;
  const ensureCanvasRendered = useCallback(async () => {
    const isDrawn = () => {
      const el = canvasWrapperRef.current;
      if (!el || el.clientWidth === 0) return false;
      return el.querySelectorAll('.react-flow__edge-path[d]:not([d=""])').length >= expectedEdgeCount;
    };
    if (isDrawn()) return;
    setMobileTab('diagram');
    // ~1s of frames, then export whatever is on screen rather than hang.
    for (let i = 0; i < 60; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (isDrawn()) return;
    }
  }, [expectedEdgeCount]);

  const handleExportPng = useCallback(async () => {
    await ensureCanvasRendered();
    if (!canvasWrapperRef.current) return;
    await exportDiagramAsPng(canvasWrapperRef.current, workspace.nodes, `${fileSafeName}.png`);
  }, [ensureCanvasRendered, fileSafeName, workspace.nodes]);

  const handleExportSvg = useCallback(async () => {
    await ensureCanvasRendered();
    if (!canvasWrapperRef.current) return;
    await exportDiagramAsSvg(canvasWrapperRef.current, workspace.nodes, `${fileSafeName}.svg`);
  }, [ensureCanvasRendered, fileSafeName, workspace.nodes]);

  const handleNewDocument = useCallback(() => {
    setModal(null);
    workspace.newDocument();
  }, [workspace]);

  // A table result on mobile needs the Diagram tab actually on screen before
  // DiagramCanvas's fitView has anything visible to pan/zoom.
  const handleSearchSelect = useCallback(
    (target: FocusTarget) => {
      focusRequestSeq.current += 1;
      setFocusRequest({ ...target, requestId: focusRequestSeq.current });
      if (isMobile) setMobileTab('diagram');
    },
    [isMobile],
  );

  const tableActions: TableActions = useMemo(
    () => ({ viewRecords: setRecordsTableId, editTable: setSettingsTableId }),
    [],
  );

  // Everything the open dialogs need, re-derived from the current schema so a
  // parse triggered by an edit in the left panel keeps the dialog in sync.
  const recordsTarget = useMemo(() => {
    if (!recordsTableId) return null;
    const table = workspace.schema.tables.find((t) => t.id === recordsTableId);
    if (!table) return null;
    return {
      table,
      records: workspace.schema.records.filter(
        (block) =>
          block.table.toLowerCase() === table.name.toLowerCase() &&
          (block.schema ?? '').toLowerCase() === (table.schema ?? '').toLowerCase(),
      ),
    };
  }, [recordsTableId, workspace.schema]);

  const settingsTarget = useMemo(() => {
    if (!settingsTableId) return null;
    const table = workspace.schema.tables.find((t) => t.id === settingsTableId);
    if (!table) return null;
    return {
      table,
      existingRefs: workspace.schema.tables.map((t) => ({ schema: t.schema, name: t.name })),
      referenceCount: findTableNameRanges(workspace.dbmlText, { schema: table.schema, name: table.name }).length,
    };
  }, [settingsTableId, workspace.schema, workspace.dbmlText]);

  // Global shortcuts: Ctrl/Cmd+S is handled inside the Monaco editor itself
  // (see EditorPanel's onSave) so it still fires while the editor has focus.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (e.key.toLowerCase() === 'f' && e.shiftKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search Tables & Columns',
        icon: Search,
        action: () => setSearchOpen(true),
        keywords: 'find table column jump go to',
      },
      { id: 'new', label: 'New Diagram', icon: Plus, action: handleNewDocument },
      { id: 'import', label: 'Import DBML', icon: Upload, action: () => fileInputRef.current?.click() },
      { id: 'export-dbml', label: 'Export DBML', icon: FileCode2, action: handleExportDbml },
      { id: 'export-png', label: 'Export PNG', icon: ImageDown, action: () => void handleExportPng() },
      { id: 'export-svg', label: 'Export SVG', icon: ImageDown, action: () => void handleExportSvg() },
      // Both of these act on the canvas, which on mobile may be the tab the
      // user is *not* looking at — bring it on screen first, or the command
      // silently does nothing.
      {
        id: 'fit',
        label: 'Fit Diagram',
        icon: Maximize2,
        action: () => {
          void ensureCanvasRendered().then(() =>
            document.querySelector<HTMLButtonElement>('[aria-label="Fit diagram to screen"]')?.click(),
          );
        },
      },
      { id: 'auto-layout', label: 'Auto Layout', icon: Copy, action: () => { void ensureCanvasRendered(); workspace.relayout(); }, keywords: 'relayout arrange' },
      {
        id: 'toggle-editor',
        label: isMobile ? 'Switch Editor / Diagram' : 'Toggle Editor',
        icon: FolderOpen,
        action: isMobile
          ? () => setMobileTab((t) => (t === 'editor' ? 'diagram' : 'editor'))
          : workspace.toggleEditorCollapsed,
      },
      {
        id: 'toggle-theme',
        label: 'Toggle Theme',
        icon: Moon,
        action: () => workspace.setTheme(cycleDbmlTheme(workspace.uiPrefs.theme)),
        keywords: 'dark light system appearance',
      },
      { id: 'rename', label: 'Rename Diagram', icon: FolderOpen, action: () => setModal('documents'), keywords: 'documents' },
      { id: 'templates', label: 'Browse Templates', icon: LayoutTemplate, action: () => setModal('templates') },
      { id: 'share', label: 'Share Diagram', icon: Link2, action: () => setModal('share') },
      { id: 'copy-dbml', label: 'Copy DBML', icon: Copy, action: () => void handleCopyDbml(), keywords: 'clipboard code' },
      { id: 'download', label: 'Documents…', icon: Download, action: () => setModal('documents') },
    ],
    [ensureCanvasRendered, handleCopyDbml, handleExportDbml, handleExportPng, handleExportSvg, handleNewDocument, isMobile, workspace],
  );

  if (!workspace.ready || !workspace.activeDocument) {
    return (
      <div
        className={`h-full w-full flex items-center justify-center bg-slate-950 dbml-light:bg-white text-slate-500 text-sm ${
          workspace.effectiveTheme === 'light' ? 'dbml-light' : ''
        }`}
      >
        <h1 className="sr-only">DBML Diagram Builder — Free DBML Editor &amp; ER Diagram Tool</h1>
        Loading…
      </div>
    );
  }

  const editorNode = (
    <>
      <h2 className="sr-only">DBML Editor</h2>
      <EditorPanel
        value={workspace.dbmlText}
        onChange={workspace.setDbmlText}
        theme={workspace.effectiveTheme}
        errorLine={revealLine}
        onSave={workspace.flushSave}
        schema={workspace.schema}
        compact={isMobile}
      />
    </>
  );

  const diagramNode = (
    <>
      <h2 className="sr-only">ER Diagram</h2>
      <ReactFlowProvider>
        <DbmlThemeProvider value={workspace.effectiveTheme}>
        <DiagramCanvas
          nodes={workspace.nodes}
          edges={workspace.edges}
          onNodeDragStop={workspace.onNodeDragStop}
          // The minimap is a 200×150 overlay — on a phone that buries the canvas
          // it is meant to summarise, so it is desktop-only.
          minimapVisible={workspace.uiPrefs.minimapVisible && !isMobile}
          wrapperRef={canvasWrapperRef}
          isEmpty={workspace.schema.tables.length === 0}
          tableActions={tableActions}
          visible={!isMobile || mobileTab === 'diagram'}
          focusRequest={focusRequest}
        />
        </DbmlThemeProvider>
      </ReactFlowProvider>
    </>
  );

  return (
    <div
      className={`dbml-app h-full w-full flex flex-col bg-slate-950 dbml-light:bg-white overflow-hidden ${
        workspace.effectiveTheme === 'light' ? 'dbml-light' : ''
      }`}
    >
      <h1 className="sr-only">DBML Diagram Builder — Free DBML Editor &amp; ER Diagram Tool</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept=".dbml,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = '';
        }}
      />

      <Header
        documentName={workspace.activeDocument.name}
        onRenameDocument={(name) => workspace.renameDocument(workspace.activeDocument!.id, name)}
        theme={workspace.uiPrefs.theme}
        onSetTheme={workspace.setTheme}
        onOpenDocuments={() => setModal('documents')}
        onOpenTemplates={() => setModal('templates')}
        onOpenShare={() => setModal('share')}
        onCopyDbml={() => void handleCopyDbml()}
        copyDbmlStatus={copyDbmlStatus}
        onOpenHelp={() => setModal('help')}
        onOpenCommandPalette={() => setPaletteOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onImportClick={() => fileInputRef.current?.click()}
        onExportDbml={handleExportDbml}
        onExportPng={() => void handleExportPng()}
        onExportSvg={() => void handleExportSvg()}
        onSave={workspace.flushSave}
        saved={workspace.saved}
        editorCollapsed={isMobile ? mobileTab !== 'editor' : workspace.uiPrefs.editorCollapsed}
        onToggleEditor={isMobile ? () => setMobileTab((t) => (t === 'editor' ? 'diagram' : 'editor')) : workspace.toggleEditorCollapsed}
      />

      {isMobile && <MobileTabs active={mobileTab} onChange={setMobileTab} warningCount={workspace.schema.warnings.length} />}

      {isMobile ? (
        // Both panels stay mounted (so the editor keeps its undo history and
        // the canvas its viewport), but the inactive one is `display: none`,
        // not `visibility: hidden`: React Flow promotes its viewport to its own
        // compositing layer, and a composited layer keeps painting through an
        // ancestor's `visibility: hidden` in Chromium — which drew the table
        // cards on top of the editor.
        <div className="flex-1 min-h-0 min-w-0 relative">
          <div className={`absolute inset-0 ${mobileTab === 'editor' ? '' : 'hidden'}`}>{editorNode}</div>
          <div className={`absolute inset-0 ${mobileTab === 'diagram' ? '' : 'hidden'}`}>{diagramNode}</div>
        </div>
      ) : (
        <SplitPane
          leftWidthPct={workspace.uiPrefs.editorWidthPct}
          onLeftWidthChange={workspace.setEditorWidthPct}
          collapsed={workspace.uiPrefs.editorCollapsed}
          onExpand={workspace.toggleEditorCollapsed}
          left={editorNode}
          right={diagramNode}
        />
      )}

      <div className="border-t border-slate-800 dbml-light:border-slate-200 bg-slate-950 dbml-light:bg-white shrink-0">
        <StatusBar
          warnings={workspace.schema.warnings}
          fatalError={workspace.fatalError}
          tableCount={workspace.schema.tables.length}
          relationshipCount={workspace.schema.relationships.length}
          storageWarning={workspace.storageWarning}
          onSelectWarning={(line) => {
            if (!line) return;
            setRevealLine(line);
            if (isMobile) setMobileTab('editor');
          }}
        />
      </div>

      {modal === 'documents' && (
        <DocumentsModal
          documents={workspace.documents}
          activeId={workspace.activeId}
          onSwitch={workspace.switchDocument}
          onNew={handleNewDocument}
          onRename={workspace.renameDocument}
          onDuplicate={workspace.duplicateDocument}
          onDelete={workspace.deleteDocument}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'templates' && <TemplatesModal onPick={handlePickTemplate} onClose={() => setModal(null)} />}
      {modal === 'share' && <ShareModal dbml={workspace.dbmlText} onClose={() => setModal(null)} />}
      {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
      {recordsTarget && (
        <RecordsModal
          tableName={recordsTarget.table.qualifiedName}
          columns={recordsTarget.table.columns}
          records={recordsTarget.records}
          onClose={() => setRecordsTableId(null)}
        />
      )}
      {settingsTarget && (
        <TableSettingsModal
          tableName={settingsTarget.table.name}
          tableSchema={settingsTarget.table.schema}
          qualifiedName={settingsTarget.table.qualifiedName}
          existingRefs={settingsTarget.existingRefs}
          referenceCount={settingsTarget.referenceCount}
          onRename={(newName) => {
            workspace.renameTable({ schema: settingsTarget.table.schema, name: settingsTarget.table.name }, newName);
            setSettingsTableId(null);
          }}
          onClose={() => setSettingsTableId(null)}
        />
      )}
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      {searchOpen && (
        <TableSearchPalette
          schema={workspace.schema}
          onClose={() => setSearchOpen(false)}
          onSelect={handleSearchSelect}
        />
      )}
      {pendingConfirm && (
        <ConfirmDialog
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel={pendingConfirm.confirmLabel}
          danger={pendingConfirm.danger}
          onConfirm={() => {
            pendingConfirm.onConfirm();
            setPendingConfirm(null);
          }}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </div>
  );
}
