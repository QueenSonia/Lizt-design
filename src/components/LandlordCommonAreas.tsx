/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import { Search, LayoutGrid, X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LandlordTopNav } from "./LandlordTopNav";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface CommonArea {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  openRequests: number;
}

const MOCK_COMMON_AREAS: CommonArea[] = [
  {
    id: "ca-001",
    name: "Main Lobby",
    address: "Ground Floor, Block A, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-11-01",
    openRequests: 2,
  },
  {
    id: "ca-002",
    name: "Rooftop Garden",
    address: "Rooftop Level, Block A, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-11-15",
    openRequests: 0,
  },
  {
    id: "ca-003",
    name: "Parking Lot B",
    address: "East Wing, Basement 1, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-12-03",
    openRequests: 1,
  },
  {
    id: "ca-004",
    name: "Generator Room",
    address: "Utility Block, Ground Floor, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2026-01-10",
    openRequests: 1,
  },
  {
    id: "ca-005",
    name: "Laundry Room",
    address: "Floor 2, Block B, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2026-02-20",
    openRequests: 0,
  },
];

interface Props {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordCommonAreas({ onMenuClick, isMobile = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role || pathname.split("/")[1] || "landlord";

  const [searchQuery, setSearchQuery] = useState("");
  const [commonAreas, setCommonAreas] = useState<CommonArea[]>(MOCK_COMMON_AREAS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");

  const filtered = useMemo(
    () =>
      commonAreas.filter(
        (ca) =>
          ca.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ca.address.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [commonAreas, searchQuery],
  );

  const handleAdd = () => {
    let valid = true;
    if (!newName.trim()) {
      setNameError("Name is required");
      valid = false;
    }
    if (!newAddress.trim()) {
      setAddressError("Address is required");
      valid = false;
    }
    if (!valid) return;

    const next: CommonArea = {
      id: `ca-${Date.now()}`,
      name: newName.trim(),
      address: newAddress.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      openRequests: 0,
    };
    setCommonAreas((prev) => [next, ...prev]);
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewName("");
    setNewAddress("");
    setNameError("");
    setAddressError("");
  };

  const handleRowClick = (id: string) => {
    router.push(`/${userRole}/common-area-detail?id=${id}`);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <LandlordTopNav
        title="Common Areas"
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        showAddButton
        onAddNew={() => setShowAddModal(true)}
        buttonText="Add Common Area"
      />

      <div className="pt-[73px] lg:pt-[81px]">
        {/* Search bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="relative sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search common areas…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8">
          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {searchQuery ? "No results found" : "No common areas yet"}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? "Try a different search term." : "Add your first common area to get started."}
              </p>
            </div>
          )}

          {/* List */}
          {filtered.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {filtered.map((ca) => (
                <button
                  key={ca.id}
                  onClick={() => handleRowClick(ca.id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4 text-[#FF5000]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ca.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{ca.address}</p>
                    <p className="text-xs text-gray-400 mt-1">Added {formatDate(ca.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {ca.openRequests > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                        {ca.openRequests} open
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            {filtered.length} {filtered.length === 1 ? "area" : "areas"}
            {searchQuery ? " found" : " total"}
          </p>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Add Common Area</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); if (nameError) setNameError(""); }}
                  placeholder="e.g. Main Lobby"
                  className={nameError ? "border-red-500" : ""}
                  autoFocus
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newAddress}
                  onChange={(e) => { setNewAddress(e.target.value); if (addressError) setAddressError(""); }}
                  placeholder="e.g. Ground Floor, Block A, 14 Admiralty Way"
                  className={addressError ? "border-red-500" : ""}
                />
                {addressError && <p className="text-xs text-red-500 mt-1">{addressError}</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white"
                onClick={handleAdd}
              >
                Add Area
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
