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
  Upload,
} from 'lucide-react';
import { Header } from './Header';
import { SplitPane } from './SplitPane';
import { EditorPanel } from './EditorPanel';
import { DiagramCanvas } from './DiagramCanvas';
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
import type { TableActions } from './TableActionsContext';
import { findTableNameRanges } from '../../../tools/dbmlDiagramBuilder/edit/renameTable';
import { useDbmlWorkspace } from '../../../tools/dbmlDiagramBuilder/state/useDbmlWorkspace';
import { useMediaQuery } from '../../../tools/dbmlDiagramBuilder/hooks/useMediaQuery';
import { downloadTextFile } from '../../../tools/dbmlDiagramBuilder/export/download';
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
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [revealLine, setRevealLine] = useState<number | null>(null);
  // Which table's header button was clicked, and which dialog it opened.
  const [recordsTable, setRecordsTable] = useState<string | null>(null);
  const [settingsTable, setSettingsTable] = useState<string | null>(null);

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

  const tableActions: TableActions = useMemo(
    () => ({ viewRecords: setRecordsTable, editTable: setSettingsTable }),
    [],
  );

  // Everything the open dialogs need, re-derived from the current schema so a
  // parse triggered by an edit in the left panel keeps the dialog in sync.
  const recordsTarget = useMemo(() => {
    if (!recordsTable) return null;
    const table = workspace.schema.tables.find((t) => t.name === recordsTable);
    if (!table) return null;
    return {
      table,
      records: workspace.schema.records.filter(
        (block) => block.table.toLowerCase() === recordsTable.toLowerCase(),
      ),
    };
  }, [recordsTable, workspace.schema]);

  const settingsTarget = useMemo(() => {
    if (!settingsTable) return null;
    if (!workspace.schema.tables.some((t) => t.name === settingsTable)) return null;
    return {
      name: settingsTable,
      existingNames: workspace.schema.tables.map((t) => t.name),
      referenceCount: findTableNameRanges(workspace.dbmlText, settingsTable).length,
    };
  }, [settingsTable, workspace.schema, workspace.dbmlText]);

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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands: Command[] = useMemo(
    () => [
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
      { id: 'toggle-theme', label: 'Toggle Theme', icon: Moon, action: () => workspace.setTheme(workspace.uiPrefs.theme === 'dark' ? 'light' : 'dark') },
      { id: 'rename', label: 'Rename Diagram', icon: FolderOpen, action: () => setModal('documents'), keywords: 'documents' },
      { id: 'templates', label: 'Browse Templates', icon: LayoutTemplate, action: () => setModal('templates') },
      { id: 'share', label: 'Share Diagram', icon: Link2, action: () => setModal('share') },
      { id: 'download', label: 'Documents…', icon: Download, action: () => setModal('documents') },
    ],
    [ensureCanvasRendered, handleExportDbml, handleExportPng, handleExportSvg, handleNewDocument, isMobile, workspace],
  );

  if (!workspace.ready || !workspace.activeDocument) {
    return <div className="h-full w-full flex items-center justify-center bg-slate-950 text-slate-500 text-sm">Loading…</div>;
  }

  const editorNode = (
    <EditorPanel
      value={workspace.dbmlText}
      onChange={workspace.setDbmlText}
      theme={workspace.effectiveTheme}
      errorLine={revealLine}
      onSave={workspace.flushSave}
      compact={isMobile}
    />
  );

  const diagramNode = (
    <ReactFlowProvider>
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
      />
    </ReactFlowProvider>
  );

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 overflow-hidden">
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
        onOpenHelp={() => setModal('help')}
        onOpenCommandPalette={() => setPaletteOpen(true)}
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

      <div className="border-t border-slate-800 bg-slate-950 shrink-0">
        <StatusBar
          warnings={workspace.schema.warnings}
          fatalError={workspace.fatalError}
          tableCount={workspace.schema.tables.length}
          relationshipCount={workspace.schema.relationships.length}
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
          tableName={recordsTarget.table.name}
          columns={recordsTarget.table.columns}
          records={recordsTarget.records}
          onClose={() => setRecordsTable(null)}
        />
      )}
      {settingsTarget && (
        <TableSettingsModal
          tableName={settingsTarget.name}
          existingNames={settingsTarget.existingNames}
          referenceCount={settingsTarget.referenceCount}
          onRename={(newName) => {
            workspace.renameTable(settingsTarget.name, newName);
            setSettingsTable(null);
          }}
          onClose={() => setSettingsTable(null)}
        />
      )}
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
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
