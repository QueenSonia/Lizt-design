/* eslint-disable */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Filter, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

import { LandlordPackage } from "@/types/packages";
import { useFetchPropertyDetails } from "@/services/property/query";
import LandlordTopNav from "@/components/LandlordTopNav";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { useMobile } from "@/contexts/MobileContext";
import { LandlordAddPropertyModal } from "@/components/LandlordAddPropertyModal";
import { LandlordAddTenantModal } from "@/components/LandlordAddTenantModal";
import AddManagerModal from "@/components/AddManagerModal";
import { useUpdatePropertyMutation } from "@/services/property/mutation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/services/axios-instance";
import { SetRentPriceRangeModal } from "@/components/SetRentPriceRangeModal";

interface LandlordPropertiesProps {
  onPropertyClick?: (propertyId: string) => void;
  searchTerm?: string;
  onMenuClick?: () => void;
  isMobile?: boolean;
  isMenuOpen?: boolean;
}

type FilterOption =
  | "All Properties"
  | "Occupied"
  | "Vacant"
  | "Marketing Ready"
  | "Inactive";
type SortColumn = "name" | "tenancyCycle" | "rent" | "rentExpiryDate" | null;
type SortDirection = "asc" | "desc";

export default function LandlordProperties({
  onPropertyClick,
  searchTerm = "",
  onMenuClick,
  isMobile = false,
  isMenuOpen = false,
}: LandlordPropertiesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const userRole = user?.role;
  const { canGoBack } = useNavigation();
  const { isMobile: isMobileContext } = useMobile();
  const [localSearchQuery, setLocalSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("landlordProperties_search") || "";
    }
    return "";
  });

  const [filterOption, setFilterOption] = useState<FilterOption>(
    () => (searchParams.get("filter") as FilterOption) || "All Properties",
  );
  const [currentPage, setCurrentPage] = useState<number>(() =>
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [sortColumn, setSortColumn] = useState<SortColumn>(
    () => (searchParams.get("sort") as SortColumn) || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => (searchParams.get("dir") as SortDirection) || "asc",
  );

  const updateQueryParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      if (newParams.get("page") === "1") {
        newParams.delete("page");
      }
      router.push(`${pathname}?${newParams.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    // Sync state from URL when searchParams change (e.g., back/forward nav)
    setFilterOption(
      (searchParams.get("filter") as FilterOption) || "All Properties",
    );
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));
    setSortColumn((searchParams.get("sort") as SortColumn) || null);
    setSortDirection((searchParams.get("dir") as SortDirection) || "asc");
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        if (localSearchQuery) {
          sessionStorage.setItem("landlordProperties_search", localSearchQuery);
        } else {
          sessionStorage.removeItem("landlordProperties_search");
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localSearchQuery]);

  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const itemsPerPage = 8;
  const [isRentPriceModalOpen, setIsRentPriceModalOpen] = useState(false);
  const [selectedPropertyForPriceRange, setSelectedPropertyForPriceRange] =
    useState<any | null>(null);

  const effectiveSearchTerm = searchTerm || localSearchQuery;
  const debouncedSearchTerm = useDebounce(effectiveSearchTerm, 300);

  const params = useMemo(
    () => ({
      search: debouncedSearchTerm,
      property_status:
        filterOption !== "All Properties" && filterOption !== "Marketing Ready"
          ? filterOption === "Occupied"
            ? "occupied"
            : filterOption === "Vacant"
              ? "vacant"
              : filterOption === "Inactive"
                ? "inactive"
                : undefined
          : undefined,
    }),
    [debouncedSearchTerm, filterOption],
  );

  const queryClient = useQueryClient();

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
        error.response?.data?.message || "Failed to add facility manager",
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleToggleMarketing = async (property: any, checked: boolean) => {
    const queryKey = ["get-properties", params];
    if (checked) {
      setSelectedPropertyForPriceRange(property);
      setIsRentPriceModalOpen(true);
    } else {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            properties:
              page.properties?.map((p: any) =>
                p.id === property.id
                  ? { ...p, is_marketing_ready: false, rental_price: null }
                  : p,
              ) || page.properties,
          })),
        };
      });

      try {
        await axios.put(`/properties/${property.id}`, {
          is_marketing_ready: false,
          rental_price: null,
        });
        toast.success("Property removed from marketing");
        queryClient.invalidateQueries({ queryKey });
      } catch (error: any) {
        queryClient.setQueryData(queryKey, previousData);
        toast.error(
          error.response?.data?.message || "Failed to update property status",
        );
      }
    }
  };

  const handleSaveRentPriceRange = async (price: number) => {
    const queryKey = ["get-properties", params];
    if (selectedPropertyForPriceRange) {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            properties:
              page.properties?.map((p: any) =>
                p.id === selectedPropertyForPriceRange.id
                  ? {
                      ...p,
                      is_marketing_ready: true,
                      rental_price: price,
                    }
                  : p,
              ) || page.properties,
          })),
        };
      });

      setIsRentPriceModalOpen(false);
      setSelectedPropertyForPriceRange(null);

      try {
        await axios.put(`/properties/${selectedPropertyForPriceRange.id}`, {
          is_marketing_ready: true,
          rental_price: price,
        });
        toast.success("Property is now ready for marketing");
        queryClient.invalidateQueries({ queryKey });
      } catch (error: any) {
        queryClient.setQueryData(queryKey, previousData);
        toast.error(
          error.response?.data?.message || "Failed to update property",
        );
      }
    } else {
      setIsRentPriceModalOpen(false);
      setSelectedPropertyForPriceRange(null);
    }
  };

  const handleCancelRentPriceRange = () => {
    setIsRentPriceModalOpen(false);
    setSelectedPropertyForPriceRange(null);
  };

  const handleCloseRentPriceModal = () => {
    setIsRentPriceModalOpen(false);
    setSelectedPropertyForPriceRange(null);
  };

  const {
    data: properties,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFetchPropertyDetails(params);

  // Automatically fetch all pages to load all properties
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      updateQueryParams({ dir: sortDirection === "asc" ? "desc" : "asc" });
    } else {
      updateQueryParams({ sort: column, dir: "asc" });
    }
  };

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties || [];

    // Client-side filter for Marketing Ready (since it's a boolean, not a status)
    if (filterOption === "Marketing Ready") {
      filtered = filtered.filter((p: any) => p.isMarketingReady);
    }

    if (sortColumn) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case "name":
            aValue = a.name?.toLowerCase() || "";
            bValue = b.name?.toLowerCase() || "";
            break;
          case "tenancyCycle":
            aValue = a.tenancyCycle || "";
            bValue = b.tenancyCycle || "";
            break;
          case "rent":
            aValue = a.rentAmount ?? -1;
            bValue = b.rentAmount ?? -1;
            break;
          case "rentExpiryDate":
            aValue = a.rentExpiryDate
              ? new Date(a.rentExpiryDate).getTime()
              : -1;
            bValue = b.rentExpiryDate
              ? new Date(b.rentExpiryDate).getTime()
              : -1;
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
  }, [properties, sortColumn, sortDirection, filterOption]);

  const totalPages = Math.ceil(
    (filteredAndSortedProperties?.length || 0) / itemsPerPage,
  );
  const paginatedProperties = filteredAndSortedProperties?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
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

  const handlePropertyClick = (propertyId: string) => {
    if (onPropertyClick) {
      onPropertyClick(propertyId);
    } else {
      router.push(`/${userRole}/property-detail?propertyId=${propertyId}`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#FAFAFA] pb-8">
        <LandlordTopNav
          title="My Properties"
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
                    type="text"
                    placeholder="Search property by name or address"
                    value={effectiveSearchTerm}
                    onChange={(e) => {
                      setLocalSearchQuery(e.target.value);
                    }}
                    className="pl-10 pr-4 py-2 border-gray-200 rounded-xl bg-white focus:border-[#FF5000] focus:ring-[#FF5000] w-full placeholder:text-sm placeholder:opacity-50"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-2 hover:bg-[#FFF3EB] hover:text-[#FF5000] shrink-0"
                    >
                      <Filter className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 bg-white rounded-xl shadow-lg border border-gray-200/50 p-1.5"
                  >
                    <DropdownMenuItem
                      onClick={() =>
                        updateQueryParams({ filter: null, page: null })
                      }
                      className={`px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150 ${
                        filterOption === "All Properties"
                          ? "bg-[#FFF3EB] text-[#FF5000]"
                          : ""
                      }`}
                    >
                      All Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateQueryParams({ filter: "Occupied", page: null })
                      }
                      className={`px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150 ${
                        filterOption === "Occupied"
                          ? "bg-[#FFF3EB] text-[#FF5000]"
                          : ""
                      }`}
                    >
                      Occupied
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateQueryParams({ filter: "Vacant", page: null })
                      }
                      className={`px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150 ${
                        filterOption === "Vacant"
                          ? "bg-[#FFF3EB] text-[#FF5000]"
                          : ""
                      }`}
                    >
                      Vacant
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateQueryParams({
                          filter: "Marketing Ready",
                          page: null,
                        })
                      }
                      className={`px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150 ${
                        filterOption === "Marketing Ready"
                          ? "bg-[#FFF3EB] text-[#FF5000]"
                          : ""
                      }`}
                    >
                      Marketing Ready
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateQueryParams({ filter: "Inactive", page: null })
                      }
                      className={`px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150 ${
                        filterOption === "Inactive"
                          ? "bg-[#FFF3EB] text-[#FF5000]"
                          : ""
                      }`}
                    >
                      Inactive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                        <Skeleton className="h-4 w-96 bg-gray-100" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-8">
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedProperties?.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Home className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h3 className="text-gray-900 mb-2">No properties found yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {effectiveSearchTerm || filterOption !== "All Properties"
                    ? "Try adjusting your search or filter options"
                    : "Click 'Add New' to create your first property"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block space-y-3">
                  <div className="grid grid-cols-12 gap-4 px-6 pb-2">
                    <div className="col-span-4">
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
                    <div className="col-span-2">
                      <button
                        onClick={() => handleSort("tenancyCycle")}
                        className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                          sortColumn === "tenancyCycle"
                            ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                            : ""
                        }`}
                      >
                        Tenancy
                      </button>
                    </div>
                    <div className="col-span-3">
                      <button
                        onClick={() => handleSort("rent")}
                        className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                          sortColumn === "rent"
                            ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                            : ""
                        }`}
                      >
                        Rent
                      </button>
                    </div>
                    <div className="col-span-3">
                      <button
                        onClick={() => handleSort("rentExpiryDate")}
                        className={`flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors ${
                          sortColumn === "rentExpiryDate"
                            ? "border-b-2 border-[#FF5000] text-[#FF5000] pb-1"
                            : ""
                        }`}
                      >
                        Rent Expiry Date
                      </button>
                    </div>
                  </div>

                  {paginatedProperties?.map((property: any) => (
                    <div
                      key={property.id}
                      className={`
                        bg-white rounded-xl shadow-sm transition-all duration-300
                        ${property.status === "Inactive" ? "opacity-70" : ""}
                      `}
                    >
                      <div
                        onClick={() => handlePropertyClick(property.id)}
                        className="grid grid-cols-12 gap-4 p-6 items-center cursor-pointer hover:bg-[#FFF5EF] transition-colors"
                      >
                        {/* Name / Description */}
                        <div className="col-span-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-normal text-gray-900">
                              {property.name}
                            </h3>
                            {property.status === "Vacant" &&
                              property.offerLetterCount > 0 && (
                                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                  Offers sent ({property.offerLetterCount})
                                </Badge>
                              )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-900 text-sm">
                            {property.tenancyCycle || "—"}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-gray-900 text-sm">
                            {formatCurrency(property.rentAmount)}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-gray-900 text-sm">
                            {formatDate(property.rentExpiryDate)}
                          </span>
                        </div>
                      </div>

                      {(property.status === "Vacant" ||
                        property.status === "Offer Pending" ||
                        property.status === "Offer Accepted") && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="px-6 pb-4 pt-2 border-t border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`marketing-${property.id}`}
                              checked={property.isMarketingReady}
                              onCheckedChange={(checked) =>
                                handleToggleMarketing(property, checked)
                              }
                              className="data-[state=checked]:bg-[#FF5000] cursor-pointer"
                            />
                            <Label
                              htmlFor={`marketing-${property.id}`}
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              Ready for Marketing
                            </Label>
                          </div>
                          {property.isMarketingReady &&
                            property.marketingPrice && (
                              <p className="text-xs text-gray-500 mt-2 ml-[30px]">
                                {formatCurrency(property.marketingPrice)} per
                                year
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {paginatedProperties?.map((property: any) => (
                    <div
                      key={property.id}
                      className={`
                        bg-white rounded-xl shadow-sm transition-all duration-300
                        ${property.status === "Inactive" ? "opacity-70" : ""}
                      `}
                    >
                      <div
                        onClick={() => handlePropertyClick(property.id)}
                        className="p-4 space-y-3 cursor-pointer hover:bg-[#FFF5EF] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-gray-900">{property.name}</h3>
                              {property.status === "Vacant" &&
                                property.offerLetterCount > 0 && (
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                    Offers sent ({property.offerLetterCount})
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">
                              Tenancy
                            </p>
                            <p className="text-gray-900">
                              {property.tenancyCycle || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Rent</p>
                            <p className="text-gray-900">
                              {formatCurrency(property.rentAmount)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 text-xs mb-1">
                              Rent Expiry Date
                            </p>
                            <p className="text-gray-900">
                              {formatDate(property.rentExpiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(property.status === "Vacant" ||
                        property.status === "Offer Pending" ||
                        property.status === "Offer Accepted") && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 pb-3 pt-2 border-t border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`marketing-mobile-${property.id}`}
                              checked={property.isMarketingReady}
                              onCheckedChange={(checked) =>
                                handleToggleMarketing(property, checked)
                              }
                              className="data-[state=checked]:bg-[#FF5000] cursor-pointer"
                            />
                            <Label
                              htmlFor={`marketing-mobile-${property.id}`}
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              Ready for Marketing
                            </Label>
                          </div>
                          {property.isMarketingReady &&
                            property.marketingPrice && (
                              <p className="text-xs text-gray-500 mt-2 ml-[30px]">
                                {formatCurrency(property.marketingPrice)} per
                                year
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[#777777] text-center sm:text-left">
                      Showing {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredAndSortedProperties.length,
                      )}{" "}
                      of {filteredAndSortedProperties.length} properties
                    </p>

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
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
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
                        ),
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
      </div>

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

      <SetRentPriceRangeModal
        isOpen={isRentPriceModalOpen}
        onClose={handleCloseRentPriceModal}
        onSave={handleSaveRentPriceRange}
        onCancel={handleCancelRentPriceRange}
        propertyName={selectedPropertyForPriceRange?.name || ""}
      />
    </>
  );
}
