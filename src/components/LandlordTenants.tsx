/* eslint-disable */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Filter, ChevronLeft, ChevronRight, Users } from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { UniversalFilterModal } from "./UniversalFilterModal";
import {
  useFetchTenantDetails,
  useFetchAllTenantsWithKyc,
} from "@/services/users/query";
import { useFetchPropertyDetails } from "@/services/property/query";
import LandlordTopNav from "@/components/LandlordTopNav";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { useMobile } from "@/contexts/MobileContext";
import { LandlordAddPropertyModal } from "@/components/LandlordAddPropertyModal";
import { LandlordAddTenantModal } from "@/components/LandlordAddTenantModal";
import AddManagerModal from "@/components/AddManagerModal";
import { toast } from "sonner";
import axios from "@/services/axios-instance";

interface LandlordTenantsProps {
  onTenantClick?: (tenantId: string) => void;
  searchTerm?: string;
  onBack?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  isMenuOpen?: boolean;
}

export default function LandlordTenants({
  onTenantClick,
  searchTerm = "",
  onMenuClick,
  isMobile = false,
  isMenuOpen = false,
}: LandlordTenantsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const userRole = user?.role;
  const { canGoBack } = useNavigation();
  const { isMobile: isMobileContext } = useMobile();
  const [localSearchTerm, setLocalSearchTerm] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("landlordTenants_search") || "";
    }
    return "";
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        if (localSearchTerm) {
          sessionStorage.setItem("landlordTenants_search", localSearchTerm);
        } else {
          sessionStorage.removeItem("landlordTenants_search");
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localSearchTerm]);

  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);

  const [filters, setFilters] = useState<any>(
    () =>
      JSON.parse(searchParams.get("filters") || "null") || {
        status: "",
        property: "",
        rentAmount: "",
        leaseExpiry: "",
      }
  );
  const [currentPage, setCurrentPage] = useState<number>(() =>
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [sortColumn, setSortColumn] = useState<
    "name" | "property" | "rent" | "daysUntilExpiry" | null
  >(() => (searchParams.get("sort") as any) || null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    () => (searchParams.get("dir") as "asc" | "desc") || "asc"
  );

  const isInitialMountSearch = useRef(true);

  const updateQueryParams = useCallback(
    (updates: Record<string, string | number | null | object>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else if (typeof value === "object") {
          newParams.set(key, JSON.stringify(value));
        } else {
          newParams.set(key, String(value));
        }
      });
      if (newParams.get("page") === "1") {
        newParams.delete("page");
      }
      router.push(`${pathname}?${newParams.toString()}`);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setLocalSearchTerm(searchParams.get("search") || "");
    setFilters(
      JSON.parse(searchParams.get("filters") || "null") || {
        status: "",
        property: "",
        rentAmount: "",
        leaseExpiry: "",
      }
    );
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));
    setSortColumn((searchParams.get("sort") as any) || null);
    setSortDirection((searchParams.get("dir") as "asc" | "desc") || "asc");
  }, [searchParams]);

  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  useEffect(() => {
    if (isInitialMountSearch.current) {
      isInitialMountSearch.current = false;
      return;
    }
    updateQueryParams({ search: debouncedSearchTerm, page: null });
  }, [debouncedSearchTerm]);

  const itemsPerPage = 10;

  const handleAddProperty = () => {
    if (isMobileContext) {
      router.push(`/${userRole}/add-property`);
    } else {
      setShowAddPropertyModal(true);
    }
  };

  const handleAddTenant = () => {
    if (isMobileContext) {
      router.push(`/${userRole}/add-tenant`);
    } else {
      setShowAddTenantModal(true);
    }
  };

  const handleAddManager = async (managerData: any) => {
    try {
      await axios.post("/users/team-members", managerData);
      toast.success("Facility manager added successfully");
      setShowAddManagerModal(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to add facility manager"
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTenantNameClick = (tenantId: string, kycApplicationId?: string) => {
    if (onTenantClick) {
      onTenantClick(tenantId);
    } else {
      const kycId = kycApplicationId || tenantId.replace(/^app-/, "");
      router.push(`/${userRole}/kyc-application-detail/${kycId}`);
    }
  };

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const {
    data: tenants,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchAllTenantsWithKyc();

  const { data: properties } = useFetchPropertyDetails({
    property_status: "occupied",
  });

  const filteredAndSortedTenants = useMemo(() => {
    if (!tenants) return [];

    let filtered = tenants.filter((tenant: any) => {
      const isActiveOrInactive =
        tenant.status === "Active" || tenant.status === "Inactive";

      if (!isActiveOrInactive) return false;

      const matchesSearch =
        debouncedSearchTerm === "" ||
        tenant.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        tenant.property
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        tenant.email
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        tenant.rent.toString().includes(debouncedSearchTerm.replace(/,/g, ""));

      const matchesStatus = !filters.status || tenant.status === filters.status;
      const matchesProperty =
        !filters.property || tenant.property.includes(filters.property);

      let matchesRentAmount = true;
      if (filters.rentAmount) {
        switch (filters.rentAmount) {
          case "under-500k":
            matchesRentAmount = tenant.rent < 500000;
            break;
          case "500k-700k":
            matchesRentAmount = tenant.rent >= 500000 && tenant.rent <= 700000;
            break;
          case "above-700k":
            matchesRentAmount = tenant.rent > 700000;
            break;
        }
      }

      let matchesLeaseExpiry = true;
      if (filters.leaseExpiry) {
        switch (filters.leaseExpiry) {
          case "expiring-soon":
            matchesLeaseExpiry = tenant.daysUntilExpiry <= 30;
            break;
          case "next-quarter":
            matchesLeaseExpiry =
              tenant.daysUntilExpiry > 30 && tenant.daysUntilExpiry <= 90;
            break;
          case "long-term":
            matchesLeaseExpiry = tenant.daysUntilExpiry > 90;
            break;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProperty &&
        matchesRentAmount &&
        matchesLeaseExpiry
      );
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "property":
            aValue = a.property.toLowerCase();
            bValue = b.property.toLowerCase();
            break;
          case "rent":
            aValue = a.rent;
            bValue = b.rent;
            break;
          case "daysUntilExpiry":
            aValue = a.daysUntilExpiry;
            bValue = b.daysUntilExpiry;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort: newest first (by created_at descending)
      filtered = [...filtered].sort((a: any, b: any) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    }

    return filtered;
  }, [tenants, debouncedSearchTerm, filters, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedTenants.length / itemsPerPage);
  const paginatedTenants = filteredAndSortedTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDaysLeftColor = (days: number): string => {
    if (days < 0) return "text-[#D32F2F]";
    if (days < 30) return "text-[#FF9800]";
    return "text-[#28A745]";
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleSort = (
    column: "name" | "property" | "rent" | "daysUntilExpiry"
  ) => {
    if (sortColumn === column) {
      updateQueryParams({ dir: sortDirection === "asc" ? "desc" : "asc" });
    } else {
      updateQueryParams({ sort: column, dir: "asc" });
    }
  };

  const propertyOptions = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    const occupiedProperties = properties
      .filter((prop: any) => prop.status === "Occupied")
      .map((prop: any) => ({
        value: prop.name,
        label: prop.name,
      }));

    const uniqueProperties = Array.from(
      new Map(
        occupiedProperties.map((item: any) => [item.value, item])
      ).values()
    );

    return uniqueProperties;
  }, [properties]);

  const filterConfigs = [
    {
      type: "select" as const,
      label: "Tenant Status",
      key: "status",
      options: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    {
      type: "select" as const,
      label: "Property",
      key: "property",
      options: propertyOptions,
    },
    {
      type: "select" as const,
      label: "Rent Amount",
      key: "rentAmount",
      options: [
        { value: "under-500k", label: "Under ₦500,000" },
        { value: "500k-700k", label: "₦500,000 - ₦700,000" },
        { value: "above-700k", label: "Above ₦700,000" },
      ],
    },
    {
      type: "select" as const,
      label: "Lease Expiry",
      key: "leaseExpiry",
      options: [
        { value: "expiring-soon", label: "Expiring Soon (30 days)" },
        { value: "next-quarter", label: "Next Quarter (30-90 days)" },
        { value: "long-term", label: "Long Term (90+ days)" },
      ],
    },
  ];

  const handleApplyFilters = (newFilters: any) => {
    updateQueryParams({ filters: newFilters, page: null });
  };

  const handleClearFilters = () => {
    updateQueryParams({ filters: null, page: null });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value && value !== "")
      .length;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-8">
      <LandlordTopNav
        title="Tenants"
        subtitle="View and manage your tenants"
        onBack={canGoBack ? handleBack : undefined}
        onAddProperty={handleAddProperty}
        onAddTenant={handleAddTenant}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        showAddNew={true}
      />

      <div className="pt-[73px] lg:pt-[81px]">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by tenant name, property, or rent amount"
                  value={localSearchTerm}
                  onChange={(e) => {
                    setLocalSearchTerm(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2 border-gray-200 rounded-xl bg-white focus:border-[#FF5000] focus:ring-[#FF5000] w-full placeholder:text-sm placeholder:opacity-50"
                />
              </div>

              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="p-2 hover:bg-[#FFF3EB] hover:text-[#FF5000] shrink-0"
                  disabled={isLoading}
                >
                  <Filter className="w-5 h-5" />
                </Button>
                {getActiveFilterCount() > 0 && (
                  <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 text-xs bg-orange-100 text-orange-700 border-orange-200">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48 bg-gray-200" />
                      <Skeleton className="h-4 w-full sm:w-96 bg-gray-100" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-8">
                      <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
              </div>
              <h3 className="text-gray-900 mb-2">Failed to Load Tenants</h3>
              <p className="text-sm text-gray-500 mb-6">
                {error?.message ||
                  "Unable to fetch tenant information. Please try again."}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#FF5000] hover:bg-[#E64500] text-white"
              >
                Retry
              </Button>
            </div>
          ) : filteredAndSortedTenants.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-gray-900 mb-2">No tenants found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {effectiveSearchTerm || getActiveFilterCount() > 0
                  ? "Try adjusting your search or filter options"
                  : tenants && tenants.length > 0
                  ? "All tenants are pending approval. Check the KYC page to review applications."
                  : "Tenants will appear here once KYC applications are approved and attached to properties"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block space-y-3">
                <div className="grid grid-cols-12 gap-4 px-6 pb-2">
                  <div className="col-span-3">
                    <button
                      onClick={() => handleSort("name")}
                      className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                        sortColumn === "name"
                          ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                          : ""
                      }`}
                    >
                      Name
                    </button>
                  </div>
                  <div className="col-span-3">
                    <button
                      onClick={() => handleSort("property")}
                      className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                        sortColumn === "property"
                          ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                          : ""
                      }`}
                    >
                      Property
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort("rent")}
                      className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                        sortColumn === "rent"
                          ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                          : ""
                      }`}
                    >
                      Rent Amount
                    </button>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Outstanding Balance
                    </span>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort("daysUntilExpiry")}
                      className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                        sortColumn === "daysUntilExpiry"
                          ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                          : ""
                      }`}
                    >
                      Days Left
                    </button>
                  </div>
                </div>

                {paginatedTenants.map((tenant: any, index: number) => {
                  const daysLeft = tenant.daysUntilExpiry;
                  return (
                    <div
                      key={tenant.id || index}
                      onClick={() => handleTenantNameClick(tenant.id, (tenant as any).kycApplicationId)}
                      className="
                        bg-white rounded-xl shadow-sm
                        hover:bg-[#FFF3EB] hover:shadow-md
                        active:scale-[0.98] active:duration-100
                        transition-all duration-200 cursor-pointer
                      "
                    >
                      <div className="grid grid-cols-12 gap-4 p-6 items-center">
                        <div className="col-span-3 flex items-center gap-2">
                          <h3 className="text-sm text-gray-900 font-medium">
                            {tenant.name}
                          </h3>
                        </div>

                        <div className="col-span-3">
                          <span className="text-sm text-gray-900">
                            {tenant.status === "Active" ? tenant.property : "—"}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-sm text-gray-900">
                            {tenant.rent ? formatCurrency(tenant.rent) : "—"}
                          </span>
                        </div>

                        <div className="col-span-2">
                          {tenant.outstandingBalance > 0 ? (
                            <span className="text-sm font-semibold text-red-600">
                              {formatCurrency(tenant.outstandingBalance)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>

                        <div className="col-span-2">
                          <span
                            className={`text-sm ${getDaysLeftColor(daysLeft)}`}
                          >
                            {tenant.rent
                              ? daysLeft < 0
                                ? `Expired (${Math.abs(daysLeft)} days)`
                                : `${daysLeft} days left`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {paginatedTenants.map((tenant: any, index: number) => {
                  const daysLeft = tenant.daysUntilExpiry;
                  return (
                    <div
                      key={tenant.id || index}
                      onClick={() => handleTenantNameClick(tenant.id, (tenant as any).kycApplicationId)}
                      className="
                        bg-white rounded-xl shadow-sm 
                        hover:bg-[#FFF3EB] hover:shadow-md
                        active:scale-[0.98] active:duration-100
                        transition-all duration-200 cursor-pointer
                      "
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-gray-900 font-medium">
                            {tenant.name}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">
                              Property
                            </p>
                            <p className="text-gray-900">
                              {tenant.status === "Active"
                                ? tenant.property
                                : "—"}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">
                                Rent Amount
                              </p>
                              <p className="text-gray-900">
                                {tenant.rent
                                  ? formatCurrency(tenant.rent)
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">
                                Outstanding Balance
                              </p>
                              {tenant.outstandingBalance > 0 ? (
                                <p className="text-sm font-semibold text-red-600">
                                  {formatCurrency(tenant.outstandingBalance)}
                                </p>
                              ) : (
                                <p className="text-gray-400">—</p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">
                                Days Left
                              </p>
                              <p className={`${getDaysLeftColor(daysLeft)}`}>
                                {tenant.rent
                                  ? daysLeft < 0
                                    ? `${Math.abs(daysLeft)} overdue`
                                    : `${daysLeft} days`
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-[#777777] text-center sm:text-left">
                    <p>
                      Page {currentPage} of {totalPages} — Showing{" "}
                      {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredAndSortedTenants.length
                      )}{" "}
                      of {filteredAndSortedTenants.length} tenants
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Last updated: {new Date().toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQueryParams({
                          page: Math.max(1, currentPage - 1),
                        })
                      }
                      disabled={currentPage === 1}
                      className="h-9 w-9 rounded-lg border-gray-200 hover:bg-[#FFF3EB] hover:border-[#FF5000] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {getPageNumbers().map((page, index) =>
                      typeof page === "number" ? (
                        <Button
                          key={index}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => updateQueryParams({ page: page })}
                          className={`h-9 w-9 rounded-lg ${
                            currentPage === page
                              ? "bg-white border-2 border-[#FF5000] text-[#FF5000] hover:bg-[#FFF3EB]"
                              : "border-gray-200 hover:bg-[#FFF3EB] hover:border-[#FF5000]"
                          }`}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span
                          key={index}
                          className="px-1 sm:px-2 text-gray-400"
                        >
                          {page}
                        </span>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQueryParams({
                          page: Math.min(totalPages, currentPage + 1),
                        })
                      }
                      disabled={currentPage === totalPages}
                      className="h-9 w-9 rounded-lg border-gray-200 hover:bg-[#FFF3EB] hover:border-[#FF5000] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <UniversalFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Tenants"
        description="Refine your tenant list with advanced filtering options"
        filters={filterConfigs}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      <LandlordAddPropertyModal
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        onPropertyAdded={() => {
          setShowAddPropertyModal(false);
        }}
      />

      <LandlordAddTenantModal
        open={showAddTenantModal}
        onOpenChange={setShowAddTenantModal}
        onTenantAdded={() => {
          setShowAddTenantModal(false);
        }}
      />

      <AddManagerModal
        isOpen={showAddManagerModal}
        onClose={() => setShowAddManagerModal(false)}
        onAdd={handleAddManager}
      />
    </div>
  );
}
