import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Command,
  Copy,
  Database,
  Download,
  FileCode2,
  FolderOpen,
  HelpCircle,
  ImageDown,
  LayoutTemplate,
  Link2,
  Maximize,
  Minimize,
  Monitor,
  Moon,
  MoreVertical,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownItem } from './DropdownMenu';
import type { UiPrefs } from '../../../tools/dbmlDiagramBuilder/persistence/localStorage';
import { cycleDbmlTheme } from '../../../tools/dbmlDiagramBuilder/theme/resolveTheme';
import { getGuideBySlug } from '../../../content/guides/data';
import { guidePath } from '../../../content/guides/categories';

const DBML_GUIDE_PATH = guidePath(getGuideBySlug('how-to-write-dbml')!);

interface HeaderProps {
  documentName: string;
  onRenameDocument: (name: string) => void;
  theme: UiPrefs['theme'];
  onSetTheme: (theme: UiPrefs['theme']) => void;
  onOpenDocuments: () => void;
  onOpenTemplates: () => void;
  onOpenShare: () => void;
  onCopyDbml: () => void;
  copyDbmlStatus: 'idle' | 'copied' | 'error';
  onOpenHelp: () => void;
  onOpenCommandPalette: () => void;
  onOpenSearch: () => void;
  onImportClick: () => void;
  onExportDbml: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onSave: () => void;
  saved: boolean;
  editorCollapsed: boolean;
  onToggleEditor: () => void;
}

const THEME_ICON: Record<UiPrefs['theme'], typeof Sun> = { dark: Moon, light: Sun, system: Monitor };

export function Header({
  documentName,
  onRenameDocument,
  theme,
  onSetTheme,
  onOpenDocuments,
  onOpenTemplates,
  onOpenShare,
  onCopyDbml,
  copyDbmlStatus,
  onOpenHelp,
  onOpenCommandPalette,
  onOpenSearch,
  onImportClick,
  onExportDbml,
  onExportPng,
  onExportSvg,
  onSave,
  saved,
  editorCollapsed,
  onToggleEditor,
}: HeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(documentName);
  const [fullscreen, setFullscreen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraftName(documentName), [documentName]);
  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed) onRenameDocument(trimmed);
    else setDraftName(documentName);
    setEditingName(false);
  };

  const ThemeIcon = THEME_ICON[theme];
  const cycleTheme = () => onSetTheme(cycleDbmlTheme(theme));

  // iOS Safari has no Fullscreen API on non-video elements, so the button is
  // hidden there rather than left to throw on tap.
  const fullscreenSupported =
    typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function';

  const toggleFullscreen = () => {
    if (!fullscreenSupported) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen().catch(() => {});
  };

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 border-b border-slate-800 dbml-light:border-slate-200 bg-slate-950 dbml-light:bg-white px-3 text-slate-200 dbml-light:text-slate-700">
      <Link
        to="/tools/developer/dbml-diagram-builder"
        className="flex items-center gap-1.5 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded"
        aria-label="DBML Diagram Builder home"
      >
        <Database size={18} className="text-blue-400" />
        <span className="hidden sm:inline text-sm font-semibold text-slate-100 dbml-light:text-slate-900">DBML Builder</span>
      </Link>

      <div className="w-px h-5 bg-slate-800 dbml-light:bg-slate-200 shrink-0" />

      <button
        type="button"
        onClick={onOpenDocuments}
        title="Switch document"
        aria-label="Switch document"
        className="flex items-center gap-1.5 shrink-0 rounded px-1.5 py-1 hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        <FolderOpen size={15} className="text-slate-400 dbml-light:text-slate-500" />
      </button>

      {editingName ? (
        <input
          ref={nameInputRef}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') {
              setDraftName(documentName);
              setEditingName(false);
            }
          }}
          className="min-w-0 w-40 sm:w-56 bg-slate-800 dbml-light:bg-slate-100 rounded px-2 py-1 text-sm text-slate-100 dbml-light:text-slate-900 outline outline-1 outline-blue-500"
          aria-label="Document name"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingName(true)}
          title="Rename diagram"
          className="group flex items-center gap-1.5 min-w-0 rounded px-1.5 py-1 hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <span className="truncate max-w-[7rem] sm:max-w-[10rem] md:max-w-xs text-sm font-medium text-slate-100 dbml-light:text-slate-900">{documentName}</span>
          <Pencil size={12} className="text-slate-500 dbml-light:text-slate-400 opacity-0 group-hover:opacity-100 shrink-0" />
        </button>
      )}

      <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 dbml-light:text-slate-400 shrink-0" aria-hidden="true">
        {saved ? (
          <>
            <Check size={12} className="text-emerald-500" /> Saved
          </>
        ) : (
          'Saving…'
        )}
      </span>

      <div className="flex-1" />

      {/* Ten icon buttons do not fit beside the document name on a phone — they
          used to overflow past the right edge, so below `md` only Export and
          Share stay put and the rest move into the ⋮ menu. */}
      <nav className="flex items-center gap-0.5 shrink-0" aria-label="Diagram actions">
        <button
          type="button"
          onClick={onOpenTemplates}
          title="Browse templates"
          aria-label="Browse templates"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <LayoutTemplate size={16} />
        </button>

        <button
          type="button"
          onClick={onImportClick}
          title="Import DBML file"
          aria-label="Import DBML file"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Upload size={16} />
        </button>

        <DropdownMenu
          align="right"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              title="Export"
              aria-label="Export diagram or DBML"
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <Download size={16} />
            </button>
          )}
        >
          {(close) => (
            <>
              <DropdownItem icon={<FileCode2 size={14} />} onClick={() => { onExportDbml(); close(); }}>
                Export .dbml
              </DropdownItem>
              <DropdownItem icon={<ImageDown size={14} />} onClick={() => { onExportPng(); close(); }}>
                Export PNG
              </DropdownItem>
              <DropdownItem icon={<ImageDown size={14} />} onClick={() => { onExportSvg(); close(); }}>
                Export SVG
              </DropdownItem>
            </>
          )}
        </DropdownMenu>

        <button
          type="button"
          onClick={onOpenShare}
          title="Share diagram"
          aria-label="Share diagram via link"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Link2 size={16} />
        </button>

        <button
          type="button"
          onClick={onCopyDbml}
          title="Copy DBML"
          aria-label={
            copyDbmlStatus === 'copied'
              ? 'DBML copied to clipboard'
              : copyDbmlStatus === 'error'
                ? 'Failed to copy DBML'
                : 'Copy DBML to clipboard'
          }
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {copyDbmlStatus === 'copied' ? (
            <Check size={16} className="text-emerald-500" />
          ) : copyDbmlStatus === 'error' ? (
            <AlertTriangle size={16} className="text-red-500" />
          ) : (
            <Copy size={16} />
          )}
        </button>

        <button
          type="button"
          onClick={onSave}
          title="Save (Ctrl/Cmd+S)"
          aria-label="Save diagram"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <FileCode2 size={16} />
        </button>

        <div className="w-px h-5 bg-slate-800 dbml-light:bg-slate-200 mx-1 hidden md:block" />

        <button
          type="button"
          onClick={onToggleEditor}
          title={editorCollapsed ? 'Show editor' : 'Hide editor'}
          aria-label={editorCollapsed ? 'Show editor panel' : 'Hide editor panel'}
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {editorCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
          aria-label={`Change theme (currently ${theme})`}
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <ThemeIcon size={16} />
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          title="Search tables & columns (Ctrl/Cmd+Shift+F)"
          aria-label="Search tables and columns"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Search size={16} />
        </button>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Command palette (Ctrl/Cmd+K)"
          aria-label="Open command palette"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Command size={16} />
        </button>

        {fullscreenSupported && (
          <button
            type="button"
            onClick={toggleFullscreen}
            title={fullscreen ? 'Exit full screen' : 'Full screen'}
            aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
            className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        )}

        <Link
          to={DBML_GUIDE_PATH}
          title="DBML guide"
          aria-label="Read the DBML guide"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <BookOpen size={16} />
        </Link>

        <button
          type="button"
          onClick={onOpenHelp}
          title="Help & shortcuts"
          aria-label="Help and keyboard shortcuts"
          className="w-8 h-8 hidden md:flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <HelpCircle size={16} />
        </button>

        <div className="md:hidden">
          <DropdownMenu
            align="right"
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                title="More actions"
                aria-label="More actions"
                className="w-9 h-9 flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <MoreVertical size={18} />
              </button>
            )}
          >
            {(close) => (
              <>
                <DropdownItem icon={<LayoutTemplate size={14} />} onClick={() => { onOpenTemplates(); close(); }}>
                  Browse templates
                </DropdownItem>
                <DropdownItem icon={<Upload size={14} />} onClick={() => { onImportClick(); close(); }}>
                  Import DBML
                </DropdownItem>
                <DropdownItem icon={<FileCode2 size={14} />} onClick={() => { onSave(); close(); }}>
                  {saved ? 'Saved' : 'Save now'}
                </DropdownItem>
                <DropdownItem icon={<Copy size={14} />} onClick={() => { onCopyDbml(); close(); }}>
                  Copy DBML
                </DropdownItem>
                <DropdownItem icon={<Search size={14} />} onClick={() => { onOpenSearch(); close(); }}>
                  Search tables & columns
                </DropdownItem>
                <DropdownItem icon={<Command size={14} />} onClick={() => { onOpenCommandPalette(); close(); }}>
                  All commands
                </DropdownItem>
                <DropdownItem icon={<ThemeIcon size={14} />} onClick={() => { cycleTheme(); close(); }}>
                  {`Theme: ${theme}`}
                </DropdownItem>
                {fullscreenSupported && (
                  <DropdownItem
                    icon={fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                    onClick={() => { toggleFullscreen(); close(); }}
                  >
                    {fullscreen ? 'Exit full screen' : 'Full screen'}
                  </DropdownItem>
                )}
                <DropdownItem icon={<HelpCircle size={14} />} onClick={() => { onOpenHelp(); close(); }}>
                  Help & shortcuts
                </DropdownItem>
                <Link
                  to={DBML_GUIDE_PATH}
                  role="menuitem"
                  onClick={close}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px] text-slate-200 dbml-light:text-slate-700 hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:bg-slate-800 dbml-light:focus-visible:bg-slate-100 focus-visible:outline-none"
                >
                  <BookOpen size={14} />
                  DBML guide
                </Link>
              </>
            )}
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
