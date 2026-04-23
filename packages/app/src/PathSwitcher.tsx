import { ChevronDown, ExternalLink, FileText, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Page, StorageBackend } from "./storage";

interface PathSwitcherProps {
  backend: StorageBackend;
  currentLabel: string;
  currentPath: string | null;
  projectPath: string | null;
  pages: Page[];
  buildLocationForPath: (path?: string | null) => string;
  dismissCount?: number;
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
  dismissCount = 0,
}: PathSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [directoryOptions, setDirectoryOptions] = useState<PathOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (dismissCount === 0) return;
    setOpen(false);
  }, [dismissCount]);

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

  const hasAnyOptions = fileOptions.length > 0 || directoryOptions.length > 0;
  const groupHeadingClass =
    "px-2.5 pt-1 pb-2 text-[0.72rem] font-bold tracking-[0.12em] text-slate-500 uppercase";
  const itemClass =
    "gap-3 rounded-2xl px-3 py-3 text-[0.92rem] text-slate-900 data-selected:bg-slate-50";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="inline-block max-w-full">
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-[2.85rem] max-w-full min-w-0 justify-between gap-3 rounded-[14px] border-slate-200/80 bg-white/[0.88] px-4 py-0 text-left text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl hover:border-slate-300 hover:bg-white/95"
            >
              <span
                className="max-w-[min(70vw,32rem)] truncate text-[0.95rem] font-semibold tracking-[-0.02em]"
                title={currentPath ?? projectPath ?? currentLabel}
              >
                {currentLabel}
              </span>
              <ChevronDown
                className={`shrink-0 text-slate-500 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                size={16}
              />
            </Button>
          }
          aria-label="Open another file or folder"
        />
      </div>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(440px,calc(100vw-40px))] gap-0 rounded-3xl border border-slate-200/80 bg-white/96 p-2 shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl"
      >
        <Command className="rounded-[inherit] bg-transparent p-0">
          <CommandInput placeholder="Search files or folders..." />
          <ScrollArea className="max-h-[min(70vh,560px)]">
            <CommandList className="max-h-none">
              <CommandEmpty className="px-3 py-4 text-sm text-slate-500">
                {hasAnyOptions ? "No matching items." : "No files or folders available."}
              </CommandEmpty>
              {fileOptions.length > 0 ? (
                <CommandGroup heading="Files" className={groupHeadingClass}>
                  {fileOptions.map((option) => (
                    <CommandItem
                      key={option.path}
                      value={`file ${option.label} ${option.path}`}
                      className={itemClass}
                      onSelect={() => openPathInNewTab(option.path)}
                    >
                      <FileText className="shrink-0" size={14} />
                      <span className="min-w-0 truncate">{option.label}</span>
                      {option.active ? (
                        <span className="ml-auto text-[0.65rem] font-semibold tracking-[0.08em] text-sky-700 uppercase">
                          Current
                        </span>
                      ) : (
                        <ExternalLink className="ml-auto shrink-0 text-slate-400" size={13} />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {fileOptions.length > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading="Folders" className={groupHeadingClass}>
                {loading ? (
                  <div className="px-3 py-3 text-sm text-slate-500">Loading folders...</div>
                ) : error ? (
                  <div className="px-3 py-3 text-sm text-slate-500">{error}</div>
                ) : directoryOptions.length > 0 ? (
                  directoryOptions.map((option) => (
                    <CommandItem
                      key={option.path}
                      value={`folder ${option.label} ${option.path}`}
                      className={itemClass}
                      onSelect={() => openPathInNewTab(option.path)}
                    >
                      <Folder className="shrink-0" size={14} />
                      <span className="min-w-0 truncate">{option.label}</span>
                      {option.active ? (
                        <span className="ml-auto text-[0.65rem] font-semibold tracking-[0.08em] text-sky-700 uppercase">
                          Current
                        </span>
                      ) : (
                        <ExternalLink className="ml-auto shrink-0 text-slate-400" size={13} />
                      )}
                    </CommandItem>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-slate-500">No folders available.</div>
                )}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
