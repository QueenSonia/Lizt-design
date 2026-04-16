/* eslint-disable */
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  Building2,
  MapPin,
  Users,
  DollarSign,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Property {
  id: number;
  name: string;
  location: string;
  status: string;
  tenantName: string;
  rentAmount: number;
  tenancyPeriod: string;
}

interface PropertiesTableProps {
  properties: Property[];
  onPropertyClick: (propertyId: number) => void;
}

type SortField = "name" | "location" | "status" | "tenantName" | "rentAmount";
type SortDirection = "asc" | "desc";

export function PropertiesTable({
  properties,
  onPropertyClick,
}: PropertiesTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Sort properties
  const sortedProperties = [...properties].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle different data types
    if (
      sortField === "name" ||
      sortField === "location" ||
      sortField === "status" ||
      sortField === "tenantName"
    ) {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortButton = ({
    field,
    children,
    icon,
  }: {
    field: SortField;
    children: React.ReactNode;
    icon?: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 justify-start hover:bg-transparent font-medium text-gray-700 hover:text-primary transition-colors group"
    >
      <div className="flex items-center space-x-2">
        {icon && (
          <span className="text-gray-500 group-hover:text-primary transition-colors">
            {icon}
          </span>
        )}
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          <ChevronUp
            className={`w-3 h-3 transition-colors ${
              sortField === field && sortDirection === "asc"
                ? "text-primary"
                : "text-gray-300"
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 transition-colors ${
              sortField === field && sortDirection === "desc"
                ? "text-primary"
                : "text-gray-300"
            }`}
          />
        </div>
      </div>
    </Button>
  );

  if (sortedProperties.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No properties added yet.</p>
            <p className="text-gray-400">
              Use the button above to register your first property.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="py-4 px-6">
                <SortButton
                  field="name"
                  icon={<Building2 className="w-4 h-4" />}
                >
                  Property Name
                </SortButton>
              </TableHead>
              <TableHead className="py-4 px-6">
                <SortButton
                  field="location"
                  icon={<MapPin className="w-4 h-4" />}
                >
                  Address
                </SortButton>
              </TableHead>
              <TableHead className="py-4 px-6">
                <SortButton field="status">Status</SortButton>
              </TableHead>
              <TableHead className="py-4 px-6">
                <SortButton
                  field="tenantName"
                  icon={<Users className="w-4 h-4" />}
                >
                  Tenant Name
                </SortButton>
              </TableHead>
              <TableHead className="py-4 px-6">
                <SortButton
                  field="rentAmount"
                  icon={<DollarSign className="w-4 h-4" />}
                >
                  Rent Amount
                </SortButton>
              </TableHead>
              <TableHead className="py-4 px-6">Tenancy Period</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProperties.map((property) => (
              <TableRow
                key={property.id}
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer group"
              >
                <TableCell className="py-4 px-6">
                  <button
                    onClick={() => onPropertyClick(property.id)}
                    className="text-gray-900 group-hover:text-primary transition-colors font-medium hover:underline underline-offset-4"
                  >
                    {property.name}
                  </button>
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-600">
                  {property.location}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <Badge
                    className={
                      property.status === "Active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  >
                    {property.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-600">
                  {property.tenantName}
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-900 font-medium">
                  {property.rentAmount > 0
                    ? formatCurrency(property.rentAmount)
                    : "—"}
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-600">
                  {property.tenancyPeriod}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
