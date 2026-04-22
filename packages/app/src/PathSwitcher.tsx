import { ChevronDown, ExternalLink, FileText, Folder } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Page, StorageBackend } from "./storage";

interface PathSwitcherProps {
  backend: StorageBackend;
  currentLabel: string;
  currentPath: string | null;
  projectPath: string | null;
  pages: Page[];
  buildLocationForPath: (path?: string | null) => string;
}

interface PathOption {
  label: string;
  path: string;
  kind: "file" | "directory";
  active: boolean;
}

function getBasename(path?: string | null) {
  const value = path?.trim();
  if (!value) return "";

  const segments = value.split(/[\\/]/).filter(Boolean);
  return segments.at(-1) || value;
}

function joinPath(parent: string, child: string) {
  const separator = parent.includes("\\") ? "\\" : "/";
  const normalizedParent = parent.endsWith(separator)
    ? parent.slice(0, -1)
    : parent;
  return `${normalizedParent}${separator}${child}`;
}

export function PathSwitcher({
  backend,
  currentLabel,
  currentPath,
  projectPath,
  pages,
  buildLocationForPath,
}: PathSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [directoryOptions, setDirectoryOptions] = useState<PathOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !projectPath || !backend.canManageProjects) return;

    let cancelled = false;

    const loadDirectories = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentListing = await backend.listDirectories(projectPath);
        const parentListing = currentListing.parentPath
          ? await backend.listDirectories(currentListing.parentPath)
          : null;

        const seenPaths = new Set<string>();
        const options: PathOption[] = [];

        const addDirectory = (path: string) => {
          if (seenPaths.has(path)) return;
          seenPaths.add(path);
          options.push({
            label: getBasename(path),
            path,
            kind: "directory",
            active: path === projectPath,
          });
        };

        addDirectory(projectPath);

        for (const directory of parentListing?.directories ?? currentListing.directories) {
          addDirectory(directory.path);
        }

        if (!cancelled) {
          setDirectoryOptions(options);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("Could not load nearby folders.");
          setDirectoryOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDirectories();

    return () => {
      cancelled = true;
    };
  }, [backend, open, projectPath]);

  const fileOptions = projectPath
    ? pages
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
        .map((page) => {
          const path = joinPath(projectPath, `${page.id}.md`);
          return {
            label: `${page.id}.md`,
            path,
            kind: "file" as const,
            active: path === currentPath,
          };
        })
    : [];

  const openPathInNewTab = (path: string) => {
    const nextLocation = buildLocationForPath(path);
    window.open(nextLocation, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="path-switcher" ref={rootRef}>
      <button
        className="path-switcher-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="path-switcher-label" title={currentPath ?? projectPath ?? currentLabel}>
          {currentLabel}
        </span>
        <ChevronDown className={open ? "path-switcher-chevron open" : "path-switcher-chevron"} size={16} />
      </button>

      {open ? (
        <div className="path-switcher-menu" role="menu" aria-label="Open another file or folder">
          {fileOptions.length > 0 ? (
            <div className="path-switcher-section">
              <div className="path-switcher-section-label">Files</div>
              {fileOptions.map((option) => (
                <button
                  key={option.path}
                  className={option.active ? "path-switcher-item active" : "path-switcher-item"}
                  type="button"
                  role="menuitem"
                  onClick={() => openPathInNewTab(option.path)}
                >
                  <span className="path-switcher-item-copy">
                    <FileText size={14} />
                    <span className="path-switcher-item-label">{option.label}</span>
                  </span>
                  <ExternalLink size={13} />
                </button>
              ))}
            </div>
          ) : null}

          <div className="path-switcher-section">
            <div className="path-switcher-section-label">Folders</div>
            {loading ? (
              <div className="path-switcher-empty">Loading folders...</div>
            ) : error ? (
              <div className="path-switcher-empty">{error}</div>
            ) : directoryOptions.length > 0 ? (
              directoryOptions.map((option) => (
                <button
                  key={option.path}
                  className={option.active ? "path-switcher-item active" : "path-switcher-item"}
                  type="button"
                  role="menuitem"
                  onClick={() => openPathInNewTab(option.path)}
                >
                  <span className="path-switcher-item-copy">
                    <Folder size={14} />
                    <span className="path-switcher-item-label">{option.label}</span>
                  </span>
                  <ExternalLink size={13} />
                </button>
              ))
            ) : (
              <div className="path-switcher-empty">No folders available.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
