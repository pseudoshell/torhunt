import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Text, useInput } from "ink";
import { useStore, CATEGORIES } from "../store";
import { Spinner } from "./Spinner";
import { SearchBar } from "./SearchBar";
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
import { QUALITY_TAGS, type QualityTag } from "../../util/tags";
import { QualityFilterBar } from "./QualityFilterBar";
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
    searchModeTrigger,
    addBookmark,
    openQrModal,
  } = useStore();

  const search = useConcurrentSearch(query);

  const [sort, setSort] = useState<Sort>("none");
  const [hideDead, setHideDead] = useState(false);
  const [textFilter, setTextFilter] = useState("");
  const [qualityTag, setQualityTag] = useState<QualityTag | "ALL">("ALL");
  const results = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.key === section);
    const base = cat?.group
      ? search.results.filter((r) => getSource(r.source).groups?.includes(cat.group!))
      : search.results;
    return sortResults(filterResults(base, hideDead, textFilter, qualityTag), sort);
  }, [search.results, section, sort, hideDead, textFilter, qualityTag]);

  const focused = region === "content";
  const [mode, setMode] = useState<Mode>(searchModeTrigger > 0 ? "search" : "list");
  const [cursor, setCursor] = useState(0);
  const selRef = useRef<string | null>(null);
  const [detail, setDetail] = useState<TorrentResult | null>(null);

  const lastTriggerRef = useRef(searchModeTrigger);
  useEffect(() => {
    if (searchModeTrigger > 0 && searchModeTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = searchModeTrigger;
      setMode("search");
    }
  }, [searchModeTrigger]);

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
    if (!focused) return;
    setResultFocus(mode === "detail" ? "detail" : "list");
    return () => setResultFocus(null);
  }, [mode, focused, setResultFocus]);

  const clamped = Math.min(cursor, Math.max(0, results.length - 1));
  const searchH = 4; // bordered search: top + content + bottom + gap
  const filterH = mode === "filter" || textFilter.trim() ? 1 : 0;
  const panelOuter = resultsPanelOuter(listRows, searchH + filterH);
  const listHeight = Math.max(3, panelOuter - 5); // -5: panel top + bottom borders + status + header + gap
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
      if (input === "/") {
        setMode("search");
        return;
      }
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
      if (input === "Q") {
        if (results[clamped]?.magnet) {
          openQrModal({ name: results[clamped]!.name, magnet: results[clamped]!.magnet });
        }
        return;
      }
      if (input === "1") { setQualityTag("ALL"); return; }
      if (input === "2") { setQualityTag("4K"); return; }
      if (input === "3") { setQualityTag("1080p"); return; }
      if (input === "4") { setQualityTag("720p"); return; }
      if (input === "5") { setQualityTag("x265"); return; }
      if (input === "6") { setQualityTag("FitGirl"); return; }
      if (input === "7") { setQualityTag("FLAC"); return; }
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
      if (input === "b") {
        const r = results[clamped];
        if (r) addBookmark({ id: r.infoHash, name: r.name, magnet: r.magnet, source: r.source, sizeBytes: r.sizeBytes });
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
      else if (input === "b" && detail)
        addBookmark({
          id: detail.infoHash,
          name: detail.name,
          magnet: detail.magnet,
          source: detail.source,
          sizeBytes: detail.sizeBytes,
        });
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

  const status = (): ReactNode => {
    if (search.loading && results.length === 0) {
      return <Spinner label={browsing ? "Fetching latest…" : "Searching…"} />;
    }
    const head = browsing
      ? `Latest from ${activeCat?.label ?? "all categories"}`
      : `Found ${results.length} result${results.length === 1 ? "" : "s"}`;
    const sortNote = sort === "none" ? "" : ` · Sorted by ${sortLabel(sort)}`;
    const filterNote = textFilter.trim() ? ` · Filtered by "${truncate(textFilter.trim(), 20)}"` : "";
    if (results.length === 0) {
      const tabSources = activeCat?.group
        ? SOURCES.filter((s) => s.groups?.includes(activeCat.group!))
        : SOURCES;
      const tabErrored = tabSources.every((s) => search.perSource[s.id]?.error);
      if (search.total === 0) {
        return (
          <Text color={COLOR.warn}>
            No sources enabled for this tab.
          </Text>
        );
      }
      if (tabErrored && activeCat) {
        const down = tabSources.filter((s) => search.perSource[s.id]?.error);
        const who = down.length === 1 ? "The source" : `All ${down.length} sources`;
        return (
          <Text color={COLOR.warn}>
            {`Couldn't reach ${activeCat.label}. ${who} may be down.`}
          </Text>
        );
      }
      return (
        <Text dimColor>
          {browsing ? "Nothing new right now." : `No results for "${truncate(query, 28)}".`}
        </Text>
      );
    }
    const loadingNote = search.loading ? ` · Streaming ${search.done}/${search.total}…` : "";
    return <Text dimColor>{`${head}${sortNote}${filterNote}${loadingNote}`}</Text>;
  };

  const showStats = useMemo(
    () => results.some((r) => r.sizeBytes > 0 || r.seeders > 0),
    [results],
  );
  const numW = Math.max(2, String(results.length).length);

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
  const count = results.length > 0 ? `- ${results.length}` : undefined;

  return (
    <Box flexDirection="column">
      <SearchBar
        width={contentWidth}
        value={query}
        editing={mode === "search"}
        placeholder={PLACEHOLDER}
        onSubmit={onSubmit}
        onExitDown={() => setMode("list")}
        onExitLeft={() => setRegion("sidebar")}
      />
      <Box>
        <Panel
          title={mode === "detail" ? "details" : browsing ? "latest" : "results"}
          width={contentWidth}
          focused={focused && mode !== "search"}
          count={mode === "detail" ? undefined : count}
          height={panelOuter}
        >
          {mode === "detail" && detail ? (
            <Detail r={detail} width={Math.max(10, contentWidth - 4)} theme={theme} />
          ) : (
            <>
              <Box justifyContent="space-between" alignItems="center">
                {status()}
                <QualityFilterBar activeTag={qualityTag} theme={theme} />
              </Box>
              <Box flexDirection="column" marginTop={results.length > 0 ? 0 : 0}>
                {results.length > 0 ? (
                  <Box>
                    <Box width={GUTTER} flexShrink={0} />
                    <Box width={numW} flexShrink={0} justifyContent="flex-end">
                      <Text color={theme.colors.rule}>#</Text>
                    </Box>
                    <Box flexGrow={1} minWidth={0} marginLeft={1}>
                      <Text color={theme.colors.rule}>NAME</Text>
                    </Box>
                    {showStats ? (
                      <>
                        <Box width={10} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                          <Text color={theme.colors.rule}>{sortMark("size", "SIZE")}</Text>
                        </Box>
                        <Box width={9} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                          <Text color={theme.colors.rule}>{sortMark("seeders", "S:L")}</Text>
                        </Box>
                      </>
                    ) : (
                      <Box width={12} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                        <Text color={theme.colors.rule}>ADDED</Text>
                      </Box>
                    )}
                    <Box width={4} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                      <Text color={theme.colors.rule}>{sortMark("source", "SRC")}</Text>
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
                        <Text color={here ? theme.colors.bright : theme.colors.accent} bold>{here ? ICON.pointer : " "}</Text>
                      </Box>
                      <Box width={numW} flexShrink={0} justifyContent="flex-end">
                        <Text color={here ? theme.colors.bright : theme.colors.rule} bold={here}>{index + 1}</Text>
                      </Box>
                      <Box flexGrow={1} minWidth={0} marginLeft={1}>
                        <Text
                          wrap="truncate-end"
                          color={here ? theme.colors.bright : undefined}
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
                              color={here ? theme.colors.alt : undefined}
                              dimColor={!here}
                            >{r.sizeBytes > 0 ? formatBytes(r.sizeBytes) : "─"}
                            </Text>
                          </Box>
                          <Box width={9} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                            <Text
                              color={here ? (r.seeders > 0 ? theme.colors.good : theme.colors.alt) : (r.seeders > 0 ? theme.colors.good : undefined)}
                              dimColor={!here && r.seeders === 0}
                              bold={here && r.seeders > 0}
                            >
                              {r.seeders || r.leechers
                                ? `${formatCount(r.seeders)}:${formatCount(r.leechers)}`
                                : "─"}
                            </Text>
                          </Box>
                        </>
                      ) : (
                        <Box width={12} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                          <Text
                            color={here ? theme.colors.alt : undefined}
                            dimColor={!here}
                          >{formatRelative(r.added) || "─"}
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
      </Box>
      {(mode === "filter" || textFilter.trim()) && (
        <Box width={contentWidth} paddingLeft={1} marginTop={0}>
          <Box flexShrink={0}>
            <Text color={theme.colors.accent} bold>{`FILTER ${ICON.pointer} `}</Text>
          </Box>
          <Box flexGrow={1} minWidth={0}>
            {mode === "filter" ? (
              <TextField
                defaultValue={textFilter}
                width={Math.max(1, contentWidth - 12)}
                onChange={setTextFilter}
                // Commit from the submit value / functional form, not the
                // render closure: a same-tick burst (ctrl+u then enter) would
                // otherwise resurrect the pre-clear text.
                onSubmit={(value) => { setTextFilter(value.trim()); setMode("list"); }}
                onExitDown={() => { setTextFilter((cur) => cur.trim()); setMode("list"); }}
                onExitLeft={() => { setTextFilter((cur) => cur.trim()); setMode("list"); }}
              />
            ) : (
              <Text wrap="truncate-end" color={theme.colors.alt}>{textFilter}</Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
