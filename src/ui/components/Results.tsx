import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Text, useInput } from "ink";
import { useStore, CATEGORIES } from "../store";
import { Spinner } from "./Spinner";
import { TextField } from "./TextField";
import { Panel } from "./Panel";
import { Rule } from "./Rule";
import { useConcurrentSearch } from "../hooks/useConcurrentSearch";
import { getSource, SOURCES } from "../../sources/registry";
import { stickCursor, wrapStep, windowStart, resultsPanelOuter } from "../move";
import { sortResults, nextSort, sortLabel, sortArrow, type Sort, type SortField } from "../sort";
import { filterResults } from "../filter";
import { COLOR, GUTTER, ICON, sourceStyle, type Theme } from "../theme";
import { cleanText, formatBytes, formatCount, formatRelative, stripControl, truncate } from "../../util/format";
import type { Source, TorrentResult } from "../../sources/types";

type Mode = "list" | "search" | "detail" | "filter";

const PLACEHOLDER = "Search or paste a magnet link…";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Box width={9} flexShrink={0}>
        <Text dimColor>{label}</Text>
      </Box>
      <Box flexGrow={1} minWidth={0}>{value}</Box>
    </Box>
  );
}

function Detail({ r, width, theme }: { r: TorrentResult; width: number; theme: Theme }) {
  const ss = sourceStyle(r.source, theme);
  const date = formatRelative(r.added);
  const health =
    r.seeders || r.leechers ? (
      <Text>
        <Text color={r.seeders > 0 ? theme.colors.good : undefined} bold={r.seeders > 0}>
          {r.seeders}
        </Text>
        <Text dimColor>{` seeders ${ICON.dot} ${r.leechers} leechers`}</Text>
      </Text>
    ) : (
      <Text dimColor>unknown</Text>
    );
  return (
    <Box flexDirection="column">
      <Box>
        <Box flexGrow={1} minWidth={0}>
          <Text bold color={theme.colors.text} wrap="truncate-end">
            {cleanText(r.name)}
          </Text>
        </Box>
        <Box flexShrink={0} marginLeft={2}>
          <Text color={ss.color} bold>
            {ss.tag}
          </Text>
        </Box>
      </Box>
      <Rule width={width} color={theme.colors.rule} />
      <Box marginTop={1} flexDirection="column">
        <DetailRow
          label="Size"
          value={
            r.sizeBytes > 0 ? (
              <Text color={theme.colors.text}>{formatBytes(r.sizeBytes)}</Text>
            ) : (
              <Text dimColor>unknown</Text>
            )
          }
        />
        <DetailRow label="Health" value={health} />
        {r.numFiles ? (
          <DetailRow label="Files" value={<Text dimColor>{String(r.numFiles)}</Text>} />
        ) : null}
        {date ? <DetailRow label="Added" value={<Text dimColor>{date}</Text>} /> : null}
        <DetailRow
          label="Hash"
          value={
            <Text color={theme.colors.alt} dimColor wrap="truncate-end">
              {stripControl(r.infoHash)}
            </Text>
          }
        />
        <DetailRow
          label="Magnet"
          value={
            <Text color={theme.colors.alt} dimColor wrap="truncate-end">
              {stripControl(r.magnet)}
            </Text>
          }
        />
      </Box>
      <Box marginTop={1}>
        <Text color={theme.colors.accent} bold>
          d
        </Text>
        <Text color={theme.colors.text}> Download</Text>
        <Text dimColor>{`  ${ICON.dot}  `}</Text>
        <Text color={theme.colors.accent} bold>
          y
        </Text>
        <Text color={theme.colors.text}> Copy</Text>
        <Text dimColor>{`  ${ICON.dot}  `}</Text>
        <Text color={theme.colors.accent} bold>
          e
        </Text>
        <Text color={theme.colors.text}> Export</Text>
        <Text dimColor>{`  ${ICON.dot}  `}</Text>
        <Text color={theme.colors.alt}>esc</Text>
        <Text dimColor> back</Text>
      </Box>
    </Box>
  );
}

export function Results() {
  const {
    query,
    submitQuery,
    section,
    region,
    setRegion,
    setCaptureMode,
    startDownload,
    requestDownloadTo,
    copyMagnet,
    fetchAndExportTorrent,
    setResultFocus,
    contentWidth,
    listRows,
    theme,
  } = useStore();

  const search = useConcurrentSearch(query);

  const [sort, setSort] = useState<Sort>("none");
  const [hideDead, setHideDead] = useState(false);
  const [textFilter, setTextFilter] = useState("");
  const results = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.key === section);
    const base = cat?.group
      ? search.results.filter((r) => getSource(r.source).groups?.includes(cat.group!))
      : search.results;
    return sortResults(filterResults(base, hideDead, textFilter), sort);
  }, [search.results, section, sort, hideDead, textFilter]);

  const focused = region === "content";
  const [mode, setMode] = useState<Mode>("list");
  const [cursor, setCursor] = useState(0);
  // The row the user navigated to, by infohash; null until they move. Keeps
  // the cursor on their row while streamed-in sources reshuffle the list.
  const selRef = useRef<string | null>(null);
  const [detail, setDetail] = useState<TorrentResult | null>(null);

  useEffect(() => {
    setCursor((c) => stickCursor(results, selRef.current, c));
  }, [results]);

  useEffect(() => {
    selRef.current = null;
    setCursor(0);
    setTextFilter("");
  }, [query, section]);

  useEffect(() => {
    if (!focused) return;
    setCaptureMode(mode === "search" || mode === "filter" ? "text" : mode === "detail" ? "esc" : "none");
    return () => setCaptureMode("none");
  }, [mode, focused, setCaptureMode]);

  useEffect(() => {
    if (!focused) setMode("list");
  }, [focused]);

  useEffect(() => {
  }, [mode, setCaptureMode]);

  useEffect(() => {
    setResultFocus(mode === "detail" ? "detail" : "list");
    return () => setResultFocus(null);
  }, [mode, setResultFocus]);

  const clamped = Math.min(cursor, Math.max(0, results.length - 1));
  const filterH = mode === "filter" || textFilter.trim() ? 1 : 0;
  const panelOuter = Math.max(5, listRows - 1 - filterH);
  const listHeight = Math.max(3, panelOuter - (results.length > 0 ? 6 : 4));
  const pageJump = Math.max(1, listHeight - 1);

  const openDownload = (r: TorrentResult): void =>
    startDownload({
      id: r.infoHash,
      name: r.name,
      magnet: r.magnet,
      source: r.source,
      sizeBytes: r.sizeBytes,
    });

  const openDownloadTo = (r: TorrentResult): void =>
    requestDownloadTo({
      id: r.infoHash,
      name: r.name,
      magnet: r.magnet,
      source: r.source,
      sizeBytes: r.sizeBytes,
    });

  const copyResultMagnet = (r: TorrentResult): void =>
    copyMagnet({ name: r.name, magnet: r.magnet });

  const moveTo = (n: number): void => {
    setCursor(n);
    selRef.current = results[n]?.infoHash ?? null;
  };

  const onSubmit = (value: string): void => {
    setMode("list");
    submitQuery(value);
  };

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") {
        if (results.length > 0 && clamped > 0) moveTo(clamped - 1);
        else setMode("search");
        return;
      }
      if (key.downArrow || input === "j") {
        if (results.length > 0 && clamped < results.length - 1) moveTo(clamped + 1);
        return;
      }
      if (key.pageUp) {
        moveTo(Math.max(0, clamped - pageJump));
        return;
      }
      if (key.pageDown) {
        moveTo(Math.min(results.length - 1, clamped + pageJump));
        return;
      }
      if (input === "g") {
        moveTo(0);
        return;
      }
      if (input === "G") {
        moveTo(results.length - 1);
        return;
      }
      if (input === "s") {
        setSort((s) => nextSort(s));
        return;
      }
      if (input === "z") {
        setHideDead((h) => !h);
        return;
      }
      if (input === "f") {
        setMode("filter");
        return;
      }
      if (input === "o") {
        if (results[clamped]) {
          setDetail(results[clamped]!);
          setMode("detail");
        }
        return;
      }
      if (key.return || input === "d") {
        if (results[clamped]) openDownload(results[clamped]!);
        return;
      }
      if (input === "D") {
        if (results[clamped]) openDownloadTo(results[clamped]!);
        return;
      }
      if (input === "y") {
        if (results[clamped]) copyResultMagnet(results[clamped]!);
        return;
      }
      if (input === "S") {
        if (results[clamped]) {
          const r = results[clamped]!;
          fetchAndExportTorrent({ id: r.infoHash, name: r.name, magnet: r.magnet });
        }
        return;
      }
      if (key.escape) {
        if (textFilter.trim()) setTextFilter("");
        return;
      }
    },
    { isActive: focused && mode === "list" },
  );

  useInput(
    (input, key) => {
      if (key.escape) {
        setMode("list");
        setDetail(null);
      } else if (input === "d" && detail) openDownload(detail);
      else if (input === "D" && detail) openDownloadTo(detail);
      else if (input === "y" && detail) copyResultMagnet(detail);
      else if (input === "e" && detail)
        fetchAndExportTorrent({ id: detail.infoHash, name: detail.name, magnet: detail.magnet });
    },
    { isActive: focused && mode === "detail" },
  );

  useInput(
    (_input, key) => {
      if (key.escape) setMode("list");
    },
    { isActive: focused && (mode === "search" || mode === "filter") },
  );

  const browsing = query.trim() === "";
  const erroredCount = useMemo(
    () => Object.values(search.perSource).filter((s) => s.error).length,
    [search.perSource],
  );
  const activeCat = CATEGORIES.find((c) => c.key === section);
  const tabSources = activeCat?.group
    ? SOURCES.filter((s) => s.groups?.includes(activeCat.group!))
    : SOURCES;
  const tabErrored =
    tabSources.length > 0 && tabSources.every((s) => search.perSource[s.id]?.error);
  // Only the active tab's sources hold its spinner; other groups' stragglers
  // stream in silently.
  const pending = tabSources.some((s) => search.perSource[s.id]?.loading);
  const showStats = useMemo(
    () => results.some((r) => r.sizeBytes > 0 || r.seeders > 0),
    [results],
  );
  const numW = Math.max(2, String(results.length).length);

  const outageCodes = (sources: readonly Source[]): string => {
    const codes = [
      ...new Set(sources.map((s) => search.perSource[s.id]?.code).filter(Boolean)),
    ];
    return codes.length ? ` (${codes.join(", ")})` : "";
  };

  const sortNote = sort === "none" ? "" : `  ${ICON.dot} sort: ${sortLabel(sort)}`;
  const filterNote = hideDead ? `  ${ICON.dot} alive only` : "";
  const head = browsing
    ? "newest across all sources"
    : `${results.length} result${results.length === 1 ? "" : "s"}`;

  const status = () => {
    if (pending) {
      // Rows are already usable: the settled header simply carries a spinner
      // until the tab's last source lands.
      if (results.length > 0)
        return (
          <Text>
            <Text dimColor>{`${head}${sortNote}${filterNote}  `}</Text>
            <Spinner />
          </Text>
        );
      return <Spinner label={browsing ? "Loading…" : "Searching…"} />;
    }
    if (results.length === 0) {
      if (erroredCount >= search.total) {
        const downAll = SOURCES.filter((s) => search.perSource[s.id]?.error);
        return (
          <Text color={COLOR.warn}>
            {`Couldn't reach any source. They may be down${outageCodes(downAll)}.`}
          </Text>
        );
      }
      if (tabErrored && activeCat) {
        const down = tabSources.filter((s) => search.perSource[s.id]?.error);
        const who = down.length === 1 ? "The source" : `All ${down.length} sources`;
        return (
          <Text color={COLOR.warn}>
            {`Couldn't reach ${activeCat.label}. ${who} may be down${outageCodes(down)}.`}
          </Text>
        );
      }
      if (hideDead) {
        const cat = CATEGORIES.find((c) => c.key === section);
        const base = cat?.group
          ? search.results.filter((r) => getSource(r.source).groups?.includes(cat.group!))
          : search.results;
        if (base.length > 0 && base.every((r) => r.seeders <= 0)) {
          return (
            <Text dimColor>
              All results have zero seeders. Press z to show them.
            </Text>
          );
        }
      }
      if (search.results.length > 0 && activeCat?.group)
        return <Text dimColor>{`No ${activeCat.label.toLowerCase()} results yet. Try another tab or a search.`}</Text>;
      return (
        <Text dimColor>
          {browsing ? "Nothing new right now." : `No results for "${truncate(query, 28)}".`}
        </Text>
      );
    }
    const note = erroredCount > 0 ? `  (${erroredCount} source${erroredCount === 1 ? "" : "s"} down)` : "";
    return <Text dimColor>{`${head}${note}${sortNote}${filterNote}`}</Text>;
  };

  const sortMark = (field: SortField, label: string): ReactNode => {
    if (sort === "none" || sort.field !== field) return label;
    return (
      <>
        <Text color={theme.colors.accent} bold>{sortArrow(sort.dir)}</Text>
        {label}
      </>
    );
  };

  const start = windowStart(clamped, results.length, listHeight);
  const visible = results.slice(start, start + listHeight);
  const count = results.length > 0 ? `(${results.length})` : undefined;

  return (
    <Box flexDirection="column">
      <Panel
        title={mode === "detail" ? "details" : browsing ? "latest" : "results"}
        width={contentWidth}
        focused={focused}
        count={mode === "detail" ? undefined : count}
        height={panelOuter}
      >
        {mode === "detail" && detail ? (
          <Detail r={detail} width={Math.max(10, contentWidth - 4)} theme={theme} />
        ) : (
          <>
            {/* Unified Command Center Search Row */}
            <Box width={Math.max(10, contentWidth - 4)} justifyContent="space-between" alignItems="center">
              <Box flexGrow={1} minWidth={0}>
                <Text color={mode === "search" ? theme.colors.accent : theme.colors.alt} bold>
                  {`${ICON.pointer} `}
                </Text>
                {mode === "search" ? (
                  <TextField
                    defaultValue={query}
                    placeholder={PLACEHOLDER}
                    width={Math.max(1, contentWidth - 25)}
                    onSubmit={onSubmit}
                    onExitDown={() => setMode("list")}
                    onExitLeft={() => setRegion("sidebar")}
                  />
                ) : (
                  <Text
                    color={query ? theme.colors.text : undefined}
                    dimColor={!query}
                    wrap="truncate-end"
                  >
                    {query || PLACEHOLDER}
                  </Text>
                )}
              </Box>
              {sort !== "none" ? (
                <Box flexShrink={0} marginLeft={1}>
                  <Text dimColor>[sort: </Text>
                  <Text color={theme.colors.accent}>{sortLabel(sort)}</Text>
                  <Text dimColor>]</Text>
                </Box>
              ) : null}
            </Box>

            {/* Divider between search and results table */}
            <Rule width={Math.max(10, contentWidth - 4)} color={theme.colors.rule} />

            <Box>{status()}</Box>
            <Box flexDirection="column" marginTop={results.length > 0 ? 1 : 0}>
                {results.length > 0 ? (
                  <Box>
                    <Box width={GUTTER} flexShrink={0} />
                    <Box width={numW} flexShrink={0} justifyContent="flex-end">
                      <Text bold dimColor>#</Text>
                    </Box>
                    <Box flexGrow={1} minWidth={0} marginLeft={1}>
                      <Text bold dimColor>Name</Text>
                    </Box>
                    {showStats ? (
                      <>
                        <Box width={10} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                          <Text bold dimColor>{sortMark("size", "Size")}</Text>
                        </Box>
                        <Box width={9} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                          <Text bold dimColor>{sortMark("seeders", "Seed:Lch")}</Text>
                        </Box>
                      </>
                    ) : (
                      <Box width={12} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                        <Text bold dimColor>Added</Text>
                      </Box>
                    )}
                    <Box width={4} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                      <Text bold dimColor>{sortMark("source", "Src")}</Text>
                    </Box>
                  </Box>
                ) : null}
                {visible.map((r, i) => {
                  const index = start + i;
                  const here = index === clamped && focused && mode === "list";
                  const ss = sourceStyle(r.source, theme);
                  return (
                    <Box key={r.infoHash}>
                      <Box width={GUTTER} flexShrink={0}>
                        <Text color={theme.colors.accent}>{here ? ICON.pointer : ""}</Text>
                      </Box>
                      <Box width={numW} flexShrink={0} justifyContent="flex-end">
                        <Text dimColor>{index + 1}</Text>
                      </Box>
                      <Box flexGrow={1} minWidth={0} marginLeft={1}>
                        <Text
                          wrap="truncate-end"
                          color={here ? theme.colors.accent : undefined}
                          dimColor={!here}
                          bold={here}
                        >
                          {cleanText(r.name)}
                        </Text>
                      </Box>
                      {showStats ? (
                        <>
                          <Box width={10} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                            <Text
                              dimColor={!here}
                              bold={here}
                            >{r.sizeBytes > 0 ? formatBytes(r.sizeBytes) : "-"}
                            </Text>
                          </Box>
                          <Box width={10} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                            <Text
                              color={r.seeders > 0 ? theme.colors.good : undefined}
                              dimColor={!here}
                              bold={here}
                            >
                              <Text color={r.seeders >= 10 ? theme.colors.good : r.seeders > 0 ? theme.colors.warn : theme.colors.bad}>
                                {r.seeders > 0 ? "● " : "○ "}
                              </Text>
                              {r.seeders || r.leechers
                                ? `${formatCount(r.seeders)}:${formatCount(r.leechers)}`
                                : "-"}
                            </Text>
                          </Box>
                        </>
                      ) : (
                        <Box width={12} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                          <Text
                            dimColor={!here}
                            bold={here}
                          >{formatRelative(r.added) || "-"}
                          </Text>
                        </Box>
                      )}
                      <Box width={4} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                        <Text
                          color={ss.color}
                          dimColor={!here}
                          bold={here}
                        >{ss.tag}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Panel>
        {(mode === "filter" || textFilter.trim()) && (
        <Box width={contentWidth} paddingLeft={1}>
          <Box flexShrink={0}>
            <Text color={theme.colors.accent}>{`Filter ${ICON.pointer} `}</Text>
          </Box>
          <Box flexGrow={1} minWidth={0}>
            {mode === "filter" ? (
              <TextField
                defaultValue={textFilter}
                width={Math.max(1, contentWidth - 10)}
                onChange={setTextFilter}
                // Commit from the submit value / functional form, not the
                // render closure: a same-tick burst (ctrl+u then enter) would
                // otherwise resurrect the pre-clear text.
                onSubmit={(value) => { setTextFilter(value.trim()); setMode("list"); }}
                onExitDown={() => { setTextFilter((cur) => cur.trim()); setMode("list"); }}
                onExitLeft={() => { setTextFilter((cur) => cur.trim()); setMode("list"); }}
              />
            ) : (
              <Text wrap="truncate-end">{textFilter}</Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
