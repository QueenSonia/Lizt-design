"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FmFeedItem,
  FmIssue,
  FmResolution,
  ISSUES,
  LIVE_POOL,
  PROPS_DATA,
  SEED,
} from "./mockData";
import { ReportModal, ReportSubmitPayload } from "./ReportModal";
import { IssueDetailModal, IssueDetailIssue } from "./IssueDetailModal";
import { Toast } from "./Toast";
import { FM_STYLES } from "./styles";

interface ReportModalState {
  open: boolean;
  initialProp?: string;
  initialArea?: string;
}

interface FmContextValue {
  feed: FmFeedItem[];
  newIds: Set<string>;
  search: string;
  setSearch: (q: string) => void;
  issues: FmIssue[];
  hasUnseenIssues: boolean;
  markIssuesSeen: () => void;
  openReportModal: (opts?: { initialProp?: string; initialArea?: string }) => void;
  openIssueDetail: (issue: IssueDetailIssue | FmIssue) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const FmContext = createContext<FmContextValue | undefined>(undefined);

export function useFmContext(): FmContextValue {
  const ctx = useContext(FmContext);
  if (!ctx)
    throw new Error("useFmContext must be used within FacilityManagerProvider");
  return ctx;
}

export function FacilityManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [feed, setFeed] = useState<FmFeedItem[]>(SEED);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState<FmIssue[]>(ISSUES);
  const [hasSeenIssues, setHasSeenIssues] = useState(false);
  const [reportState, setReportState] = useState<ReportModalState>({
    open: false,
  });
  const [activeIssue, setActiveIssue] = useState<
    IssueDetailIssue | FmIssue | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const liveIdx = useRef(0);

  const pendingCount = issues.filter((i) => i.status === "open").length;
  const hasUnseenIssues = !hasSeenIssues && pendingCount > 0;

  const addNew = useCallback((id: string) => {
    setNewIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setNewIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (liveIdx.current >= LIVE_POOL.length) return;
      const src = LIVE_POOL[liveIdx.current++];
      const item: FmFeedItem = {
        id: `live${Date.now()}`,
        ...src,
        time: Date.now(),
      };
      setFeed((f) => [item, ...f]);
      addNew(item.id);
    }, 24000);
    return () => clearInterval(t);
  }, [addNew]);

  const markIssuesSeen = useCallback(() => setHasSeenIssues(true), []);

  const openReportModal = useCallback(
    (opts?: { initialProp?: string; initialArea?: string }) => {
      setReportState({
        open: true,
        initialProp: opts?.initialProp,
        initialArea: opts?.initialArea,
      });
    },
    []
  );

  const closeReportModal = () => setReportState({ open: false });

  const handleReportSubmit = ({
    desc,
    prop,
    commonArea,
  }: ReportSubmitPayload) => {
    const propName =
      PROPS_DATA.find((p) => p.id === prop)?.name ||
      commonArea ||
      "Unknown property";
    const item: FmFeedItem = {
      id: `r${Date.now()}`,
      type: "issue_reported",
      entity: desc.length > 60 ? desc.slice(0, 60) + "…" : desc,
      property: propName,
      time: Date.now(),
    };
    setFeed((f) => [item, ...f]);
    addNew(item.id);
    setToast("Issue reported successfully");
  };

  const openIssueDetail = useCallback(
    (issue: IssueDetailIssue | FmIssue) => setActiveIssue(issue),
    []
  );

  const handleIssueStatusChange = (
    id: string,
    status: string,
    resolution?: FmResolution
  ) => {
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next: FmIssue = { ...i, status: status as FmIssue["status"] };
        if (resolution !== undefined) next.resolutions = [...(i.resolutions ?? []), resolution];
        return next;
      })
    );
    setActiveIssue((prev) => {
      if (!prev || prev.id !== id) return prev;
      const next = { ...prev, status };
      if (resolution !== undefined)
        (next as IssueDetailIssue).resolutions = [...((prev as IssueDetailIssue).resolutions ?? []), resolution];
      return next as IssueDetailIssue;
    });
  };

  const value = useMemo<FmContextValue>(
    () => ({
      feed,
      newIds,
      search,
      setSearch,
      issues,
      hasUnseenIssues,
      markIssuesSeen,
      openReportModal,
      openIssueDetail,
      setSidebarCollapsed,
      sidebarCollapsed,
      isMobileSidebarOpen,
      setMobileSidebarOpen,
    }),
    [
      feed,
      newIds,
      search,
      issues,
      hasUnseenIssues,
      markIssuesSeen,
      openReportModal,
      openIssueDetail,
      sidebarCollapsed,
      isMobileSidebarOpen,
    ]
  );

  return (
    <FmContext.Provider value={value}>
      <style dangerouslySetInnerHTML={{ __html: FM_STYLES }} />
      {children}
      {reportState.open && (
        <ReportModal
          onClose={closeReportModal}
          onSubmit={handleReportSubmit}
          initialProp={reportState.initialProp}
          initialArea={reportState.initialArea}
        />
      )}
      {activeIssue && (
        <IssueDetailModal
          issue={activeIssue}
          onClose={() => setActiveIssue(null)}
          onStatusChange={handleIssueStatusChange}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </FmContext.Provider>
  );
}
