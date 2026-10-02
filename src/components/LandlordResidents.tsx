"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, UsersRound, Plus, ChevronRight, X, ArrowLeft,
  Building2, ChevronDown, Trash2,
} from "lucide-react";
import { Input } from "./ui/input";
import { stickyHeadClass } from "./TableControls";
import { useTableScrollShadow } from "@/hooks/useTableScrollShadow";
import { toast } from "sonner";
import {
  Building,
  Resident,
  MOCK_BUILDINGS,
  MOCK_RESIDENTS,
} from "@/lib/residentMockData";

// ── Building Select ───────────────────────────────────────────────────────────

function BuildingSelect({
  buildings,
  selectedId,
  onSelect,
  onCreateNew,
  error,
}: {
  buildings: Building[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = buildings.find((b) => b.id === selectedId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return buildings;
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q)
    );
  }, [buildings, search]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 h-10 rounded-lg border text-sm text-left transition-colors bg-white ${
          error
            ? "border-red-400 focus:ring-red-200"
            : open
            ? "border-[#FF5000] ring-1 ring-[#FF5000]/20"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.name : "Select a building"}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden z-10 relative">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search buildings…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-200 focus:border-[#FF5000]"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-36 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">
                No buildings match &ldquo;{search}&rdquo;
              </p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelect(b.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-start gap-2 ${
                    selectedId === b.id
                      ? "bg-orange-50 text-[#FF5000]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <span>
                    <span className="font-medium">{b.name}</span>
                    {b.address && (
                      <span className="block text-xs text-gray-400 mt-0.5">{b.address}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Create new */}
          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(""); onCreateNew(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#FF5000] hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create new building
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface LandlordResidentsProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordResidents({ onMenuClick, isMobile }: LandlordResidentsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  // ── List state ──────────────────────────────────────────────────────────────
  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  const [buildings, setBuildings] = useState<Building[]>(MOCK_BUILDINGS);
  const [search, setSearch] = useState("");

  const { ref: tableScrollRef, scrolled: tableScrolled, onScroll: handleTableScroll } =
    useTableScrollShadow<HTMLDivElement>();

  const filtered = useMemo(
    () =>
      residents.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.building.toLowerCase().includes(search.toLowerCase()) ||
          r.phone.includes(search)
      ),
    [residents, search]
  );

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [modalView, setModalView] = useState<"resident" | "building">("resident");

  // Resident form
  const [resForm, setResForm] = useState({ name: "", phone: "", unit: "", buildingId: "" });
  const [resErrors, setResErrors] = useState({ name: "", phone: "", unit: "", building: "" });

  // Building form
  const [bldForm, setBldForm] = useState({ name: "", address: "", commonAreas: [""] });
  const [bldErrors, setBldErrors] = useState({ name: "", address: "" });

  const openAdd = () => {
    setResForm({ name: "", phone: "", unit: "", buildingId: "" });
    setResErrors({ name: "", phone: "", unit: "", building: "" });
    setBldForm({ name: "", address: "", commonAreas: [""] });
    setBldErrors({ name: "", address: "" });
    setModalView("resident");
    setAddOpen(true);
  };

  const closeAdd = () => setAddOpen(false);

  // ── Resident form handlers ──────────────────────────────────────────────────
  const setResField = (field: keyof typeof resForm, value: string) => {
    setResForm((f) => ({ ...f, [field]: value }));
    setResErrors((e) => ({ ...e, [field === "buildingId" ? "building" : field]: "" }));
  };

  const validateResident = () => {
    const e = { name: "", phone: "", unit: "", building: "" };
    let ok = true;
    if (!resForm.name.trim()) { e.name = "Full name is required"; ok = false; }
    if (!resForm.phone.trim()) { e.phone = "Phone number is required"; ok = false; }
    if (!resForm.unit.trim()) { e.unit = "Unit/Flat is required"; ok = false; }
    if (!resForm.buildingId) { e.building = "Please select or create a building"; ok = false; }
    setResErrors(e);
    return ok;
  };

  const handleAddResident = () => {
    if (!validateResident()) return;
    const building = buildings.find((b) => b.id === resForm.buildingId)!;
    const nextNum = residents.length + 1;
    const newResident: Resident = {
      id: `RES-${String(nextNum).padStart(3, "0")}`,
      name: resForm.name.trim(),
      phone: resForm.phone.trim(),
      unit: resForm.unit.trim(),
      building: building.name,
      dateAdded: new Date().toISOString().split("T")[0],
    };
    setResidents((prev) => [newResident, ...prev]);
    closeAdd();
    toast.success(`${newResident.name} added as a resident.`);
  };

  // ── Building form handlers ─────────────────────────────────────────────────
  const setBldField = (field: "name" | "address", value: string) => {
    setBldForm((f) => ({ ...f, [field]: value }));
    setBldErrors((e) => ({ ...e, [field]: "" }));
  };

  const setCommonArea = (index: number, value: string) => {
    setBldForm((f) => {
      const areas = [...f.commonAreas];
      areas[index] = value;
      return { ...f, commonAreas: areas };
    });
  };

  const addCommonAreaRow = () => {
    setBldForm((f) => ({ ...f, commonAreas: [...f.commonAreas, ""] }));
  };

  const removeCommonAreaRow = (index: number) => {
    setBldForm((f) => {
      const areas = f.commonAreas.filter((_, i) => i !== index);
      return { ...f, commonAreas: areas.length ? areas : [""] };
    });
  };

  const validateBuilding = () => {
    const e = { name: "", address: "" };
    let ok = true;
    if (!bldForm.name.trim()) { e.name = "Building name is required"; ok = false; }
    if (!bldForm.address.trim()) { e.address = "Address is required"; ok = false; }
    setBldErrors(e);
    return ok;
  };

  const handleCreateBuilding = () => {
    if (!validateBuilding()) return;
    const newBuilding: Building = {
      id: `b-${Date.now()}`,
      name: bldForm.name.trim(),
      address: bldForm.address.trim(),
      commonAreas: bldForm.commonAreas.map((a) => a.trim()).filter(Boolean),
    };
    setBuildings((prev) => [...prev, newBuilding]);
    setResForm((f) => ({ ...f, buildingId: newBuilding.id }));
    setResErrors((e) => ({ ...e, building: "" }));
    setBldForm({ name: "", address: "", commonAreas: [""] });
    setBldErrors({ name: "", address: "" });
    setModalView("resident");
    toast.success(`"${newBuilding.name}" created and selected.`);
  };

  const goToCreateBuilding = () => {
    setBldForm({ name: "", address: "", commonAreas: [""] });
    setBldErrors({ name: "", address: "" });
    setModalView("building");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">

      {/* Fixed header */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && onMenuClick && (
              <button
                onClick={onMenuClick}
                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-slate-100"
              >
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Residents</h1>
              <p className="text-xs text-slate-500 mt-0.5">All residents grouped by building</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 h-9 px-3 bg-[#FF5000] hover:bg-[#e04600] text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Resident</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-2">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, building or phone..."
              className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-orange-200 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto lg:pt-[125px]">
        <div className="px-4 sm:px-6 pt-8 pb-5">

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <UsersRound className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 text-sm font-medium mb-1">
                {search ? "No residents match your search." : "No residents yet"}
              </p>
              {!search && (
                <p className="text-gray-400 text-xs">Add a resident to get started.</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div ref={tableScrollRef} onScroll={handleTableScroll} className="max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className={stickyHeadClass(tableScrolled)}>
                      <tr>
                        <th className="text-left px-6 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resident Name</span>
                        </th>
                        <th className="text-left px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
                        </th>
                        <th className="text-left px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Building</span>
                        </th>
                        <th className="text-left px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit</span>
                        </th>
                        <th className="text-left px-4 py-3 pr-6">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date Added</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => router.push(`/${userRole}/residents/${r.id}`)}
                          className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{r.name}</p>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{r.phone}</td>
                          <td className="px-4 py-4 text-gray-700">{r.building}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs">{r.unit}</td>
                          <td className="px-4 py-4 pr-6 text-gray-500 text-xs">{r.dateAdded}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => router.push(`/${userRole}/residents/${r.id}`)}
                    className="px-4 py-4 active:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-gray-400 mb-0.5">Phone</p>
                        <p className="text-gray-700">{r.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Unit</p>
                        <p className="text-gray-700">{r.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Building</p>
                        <p className="text-gray-700">{r.building}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Date Added</p>
                        <p className="text-gray-500">{r.dateAdded}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Add Resident / Create Building Modal ────────────────────────────── */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={closeAdd}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── View: Resident Form ── */}
            {modalView === "resident" && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                  <h2 className="text-base font-semibold text-gray-900">Add Resident</h2>
                  <button onClick={closeAdd} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={resForm.name}
                      onChange={(e) => setResField("name", e.target.value)}
                      placeholder="e.g. Emeka Okonkwo"
                      className={resErrors.name ? "border-red-400 focus-visible:ring-red-200" : ""}
                    />
                    {resErrors.name && <p className="text-xs text-red-500">{resErrors.name}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={resForm.phone}
                      onChange={(e) => setResField("phone", e.target.value)}
                      placeholder="+234 xxx xxx xxxx"
                      className={resErrors.phone ? "border-red-400 focus-visible:ring-red-200" : ""}
                    />
                    {resErrors.phone && <p className="text-xs text-red-500">{resErrors.phone}</p>}
                  </div>

                  {/* Unit/Flat */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit / Flat <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={resForm.unit}
                      onChange={(e) => setResField("unit", e.target.value)}
                      placeholder="e.g. Flat 3B"
                      className={resErrors.unit ? "border-red-400 focus-visible:ring-red-200" : ""}
                    />
                    {resErrors.unit && <p className="text-xs text-red-500">{resErrors.unit}</p>}
                  </div>

                  {/* Building */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Building <span className="text-red-500">*</span>
                    </label>
                    <BuildingSelect
                      buildings={buildings}
                      selectedId={resForm.buildingId}
                      onSelect={(id) => setResField("buildingId", id)}
                      onCreateNew={goToCreateBuilding}
                      error={resErrors.building}
                    />
                  </div>

                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={closeAdd}
                    className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddResident}
                    className="flex-1 h-10 rounded-lg bg-[#FF5000] hover:bg-[#e04600] text-white text-sm font-semibold transition-colors"
                  >
                    Add Resident
                  </button>
                </div>
              </>
            )}

            {/* ── View: Create Building ── */}
            {modalView === "building" && (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                  <button
                    onClick={() => setModalView("resident")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="flex-1 text-base font-semibold text-gray-900">New Building</h2>
                  <button onClick={closeAdd} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

                  {/* Building Name */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Building Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={bldForm.name}
                      onChange={(e) => setBldField("name", e.target.value)}
                      placeholder="e.g. Cedar Park Residences"
                      autoFocus
                      className={bldErrors.name ? "border-red-400 focus-visible:ring-red-200" : ""}
                    />
                    {bldErrors.name && <p className="text-xs text-red-500">{bldErrors.name}</p>}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={bldForm.address}
                      onChange={(e) => setBldField("address", e.target.value)}
                      placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                      className={bldErrors.address ? "border-red-400 focus-visible:ring-red-200" : ""}
                    />
                    {bldErrors.address && <p className="text-xs text-red-500">{bldErrors.address}</p>}
                  </div>

                  {/* Common Areas */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Common Areas</label>
                      <p className="text-xs text-gray-400 mt-0.5">Optional — add shared spaces in this building</p>
                    </div>

                    <div className="space-y-2">
                      {bldForm.commonAreas.map((area, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={area}
                            onChange={(e) => setCommonArea(i, e.target.value)}
                            placeholder={`e.g. ${["Lobby", "Generator Room", "Rooftop"][i % 3]}`}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeCommonAreaRow(i)}
                            disabled={bldForm.commonAreas.length === 1 && !area}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addCommonAreaRow}
                      className="flex items-center gap-1.5 text-sm text-[#FF5000] hover:text-[#e04600] font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add area
                    </button>
                  </div>

                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setModalView("resident")}
                    className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateBuilding}
                    className="flex-1 h-10 rounded-lg bg-[#FF5000] hover:bg-[#e04600] text-white text-sm font-semibold transition-colors"
                  >
                    Create Building
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
