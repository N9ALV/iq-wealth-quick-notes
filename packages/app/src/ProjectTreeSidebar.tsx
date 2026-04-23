import { preparePresortedFileTreeInput } from "@pierre/trees";
import { FileTree, useFileTree } from "@pierre/trees/react";
import type React from "react";
import { FolderTree } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectTreeListing, StorageBackend } from "./storage";

interface ProjectTreeSidebarProps {
  backend: StorageBackend;
  projectPath: string | null;
  currentPath: string | null;
  buildLocationForPath: (path?: string | null) => string;
}

interface ProjectTreePanelProps {
  backend: StorageBackend;
  projectPath: string;
  currentPath: string | null;
  listing: ProjectTreeListing;
  buildLocationForPath: (path?: string | null) => string;
}

function toSlashPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function toCanonicalRelativePath(projectPath: string, currentPath: string | null): string | null {
  if (!currentPath) return null;

  const normalizedProjectPath = toSlashPath(projectPath).replace(/\/+$/, "");
  const normalizedCurrentPath = toSlashPath(currentPath).replace(/\/+$/, "");

  if (normalizedCurrentPath === normalizedProjectPath) return null;
  if (!normalizedCurrentPath.startsWith(`${normalizedProjectPath}/`)) return null;

  return normalizedCurrentPath.slice(normalizedProjectPath.length + 1);
}

function joinProjectPath(projectPath: string, relativePath: string): string {
  const separator = projectPath.includes("\\") ? "\\" : "/";
  const normalizedProjectPath = projectPath.endsWith(separator)
    ? projectPath.slice(0, -1)
    : projectPath;

  return relativePath
    .split("/")
    .filter(Boolean)
    .reduce((result, segment) => `${result}${separator}${segment}`, normalizedProjectPath);
}

function getInitialExpandedPaths(activePath: string | null): string[] {
  if (!activePath) return [];

  const segments = activePath.replace(/\/$/, "").split("/").filter(Boolean);
  const directorySegments = activePath.endsWith("/") ? segments : segments.slice(0, -1);
  const expandedPaths: string[] = [];

  for (let index = 0; index < directorySegments.length; index += 1) {
    expandedPaths.push(`${directorySegments.slice(0, index + 1).join("/")}/`);
  }

  return expandedPaths;
}

function openSelectedPath(
  backend: StorageBackend,
  projectPath: string,
  relativePath: string,
  buildLocationForPath: ProjectTreeSidebarProps["buildLocationForPath"]
): void {
  if (relativePath.endsWith("/")) return;

  if (relativePath.toLowerCase().endsWith(".md")) {
    window.location.assign(buildLocationForPath(joinProjectPath(projectPath, relativePath)));
    return;
  }

  const fileUrl = backend.resolveFileUrl(relativePath);
  if (fileUrl) {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }
}

function ProjectTreePanel({
  backend,
  projectPath,
  currentPath,
  listing,
  buildLocationForPath,
}: ProjectTreePanelProps) {
  const activePath = toCanonicalRelativePath(projectPath, currentPath);
  const [preparedInput] = useState(() => preparePresortedFileTreeInput(listing.paths));
  const [initialExpandedPaths] = useState(() => getInitialExpandedPaths(activePath));

  const { model } = useFileTree({
    preparedInput,
    initialExpansion: 1,
    initialExpandedPaths,
    initialSelectedPaths: activePath ? [activePath] : undefined,
    itemHeight: 30,
    overscan: 10,
    icons: { set: "complete", colored: true },
    onSelectionChange: (selectedPaths) => {
      const nextPath = selectedPaths[0];
      if (!nextPath || nextPath === activePath) return;
      openSelectedPath(backend, projectPath, nextPath, buildLocationForPath);
    },
  });

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/70">
      <FileTree
        className="h-full w-full"
        model={model}
        style={
          {
            height: "100%",
            width: "100%",
            "--trees-bg-override": "transparent",
            "--trees-bg-muted-override": "rgba(241, 245, 249, 0.78)",
            "--trees-border-color-override": "rgba(226, 232, 240, 0.78)",
            "--trees-fg-override": "rgb(15 23 42)",
            "--trees-fg-muted-override": "rgb(100 116 139)",
            "--trees-selected-bg-override": "rgba(14, 165, 233, 0.12)",
            "--trees-selected-fg-override": "rgb(8 47 73)",
            "--trees-selected-focused-border-color-override": "rgba(56, 189, 248, 0.6)",
            "--trees-font-family-override":
              '"SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
            "--trees-font-size-override": "13px",
            "--trees-border-radius-override": "14px",
            "--trees-padding-inline-override": "10px",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export function ProjectTreeSidebar({
  backend,
  projectPath,
  currentPath,
  buildLocationForPath,
}: ProjectTreeSidebarProps) {
  const [listing, setListing] = useState<ProjectTreeListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backend.canManageProjects || !projectPath) {
      setListing(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadListing = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextListing = await backend.listProjectTree();
        if (!cancelled) {
          setListing(nextListing);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setListing(null);
          setError("Could not load the folder tree.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadListing();

    return () => {
      cancelled = true;
    };
  }, [backend, projectPath]);

  if (!backend.canManageProjects || !projectPath) {
    return null;
  }

  return (
    <aside className="fixed top-[98px] left-[40px] z-[105] flex h-[min(68vh,640px)] w-[min(360px,calc(100vw-40px))] max-w-[calc(100vw-40px)] flex-col rounded-[28px] border border-slate-200/80 bg-white/92 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl">
      <div className="flex items-center gap-2 px-1 pb-3 text-[0.72rem] font-bold tracking-[0.12em] text-slate-500 uppercase">
        <FolderTree size={14} />
        <span>File Tree</span>
        {listing ? <span className="ml-auto text-slate-400">{listing.paths.length}</span> : null}
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-[22px] border border-slate-200/80 bg-white/70 px-4 text-sm text-slate-500">
          Loading folder tree...
        </div>
      ) : error ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-[22px] border border-slate-200/80 bg-white/70 px-4 text-center text-sm text-slate-500">
          {error}
        </div>
      ) : listing && listing.paths.length > 0 ? (
        <ProjectTreePanel
          key={`${projectPath}:${currentPath ?? ""}:${listing.paths.length}`}
          backend={backend}
          projectPath={projectPath}
          currentPath={currentPath}
          listing={listing}
          buildLocationForPath={buildLocationForPath}
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-[22px] border border-slate-200/80 bg-white/70 px-4 text-center text-sm text-slate-500">
          No files or folders in this location.
        </div>
      )}
    </aside>
  );
}
