/* eslint-disable */
import { useState } from "react";
import {
  Search,
  Filter,
  CreditCard,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PaymentDetailsModal } from "./PaymentDetailsModal";

interface LandlordRentPaymentsProps {
  searchTerm?: string;
}

// Mock payment transactions data
const mockPaymentData = [
  {
    id: 1,
    paymentId: "PAY-2024-001234",
    tenantName: "Sarah Johnson",
    property: "Sunset Apartments Unit 4A",
    amountPaid: 750000,
    paymentMethod: "Bank Transfer",
    status: "Successful",
    dateTime: "2024-11-28 14:30:00",
    transactionRef: "TXN-REF-001234567",
    tenantPhone: "+234 802 123 4567",
    tenantEmail: "sarah.johnson@email.com",
    propertyAddress: "123 Sunset Avenue, Victoria Island",
    breakdown: {
      rent: 750000,
      serviceCharge: 0,
      lateFee: 0,
      total: 750000,
    },
    bankDetails: {
      bank: "Access Bank",
      accountNumber: "1234567890",
      accountName: "Sarah Johnson",
    },
  },
  {
    id: 2,
    paymentId: "PAY-2024-001235",
    tenantName: "Michael Chen",
    property: "Ocean View Towers Unit 8B",
    amountPaid: 850000,
    paymentMethod: "Card Payment",
    status: "Failed",
    dateTime: "2024-11-27 09:15:00",
    transactionRef: "TXN-REF-001234568",
    tenantPhone: "+234 803 234 5678",
    tenantEmail: "michael.chen@email.com",
    propertyAddress: "456 Ocean View Drive, Lekki",
    breakdown: {
      rent: 850000,
      serviceCharge: 0,
      lateFee: 0,
      total: 850000,
    },
    failureReason: "Insufficient funds",
  },
  {
    id: 3,
    paymentId: "PAY-2024-001236",
    tenantName: "David Adebayo",
    property: "City Centre Plaza Unit 5A",
    amountPaid: 580000,
    paymentMethod: "Mobile Money",
    status: "Successful",
    dateTime: "2024-12-03 16:45:00",
    transactionRef: "TXN-REF-001234569",
    tenantPhone: "+234 805 456 7890",
    tenantEmail: "david.adebayo@email.com",
    propertyAddress: "789 City Centre Avenue, Lagos Island",
    breakdown: {
      rent: 580000,
      serviceCharge: 0,
      lateFee: 0,
      total: 580000,
    },
  },
  {
    id: 4,
    paymentId: "PAY-2024-001237",
    tenantName: "Grace Emenike",
    property: "Sunset Apartments Unit 3C",
    amountPaid: 720000,
    paymentMethod: "Bank Transfer",
    status: "Pending",
    dateTime: "2024-12-04 11:20:00",
    transactionRef: "TXN-REF-001234570",
    tenantPhone: "+234 806 567 8901",
    tenantEmail: "grace.emenike@email.com",
    propertyAddress: "123 Sunset Avenue, Victoria Island",
    breakdown: {
      rent: 700000,
      serviceCharge: 15000,
      lateFee: 5000,
      total: 720000,
    },
    bankDetails: {
      bank: "GTBank",
      accountNumber: "0987654321",
      accountName: "Grace Emenike",
    },
  },
  {
    id: 5,
    paymentId: "PAY-2024-001238",
    tenantName: "John Okafor",
    property: "Marina Heights Unit 1A",
    amountPaid: 325000,
    paymentMethod: "Card Payment",
    status: "Refunded",
    dateTime: "2024-11-30 13:10:00",
    transactionRef: "TXN-REF-001234571",
    tenantPhone: "+234 807 678 9012",
    tenantEmail: "john.okafor@email.com",
    propertyAddress: "321 Marina Drive, Victoria Island",
    breakdown: {
      rent: 650000,
      serviceCharge: 0,
      lateFee: 0,
      total: 650000,
    },
    refundReason: "Duplicate payment",
    refundAmount: 325000,
  },
];

export default function LandlordRentPayments({
  searchTerm = "",
}: LandlordRentPaymentsProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "refunded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <RotateCcw className="w-4 h-4" />;
      case "refunded":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredPaymentData = mockPaymentData.filter((payment) => {
    const matchesSearch =
      effectiveSearchTerm === "" ||
      payment.tenantName
        .toLowerCase()
        .includes(effectiveSearchTerm.toLowerCase()) ||
      payment.property
        .toLowerCase()
        .includes(effectiveSearchTerm.toLowerCase()) ||
      payment.paymentId
        .toLowerCase()
        .includes(effectiveSearchTerm.toLowerCase()) ||
      payment.transactionRef
        .toLowerCase()
        .includes(effectiveSearchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || payment.status === statusFilter;
    const matchesProperty =
      propertyFilter === "All" || payment.property.includes(propertyFilter);

    return matchesSearch && matchesStatus && matchesProperty;
  });

  // Calculate statistics
  const totalPayments = mockPaymentData.reduce(
    (sum, payment) => sum + payment.amountPaid,
    0
  );
  const successfulTransactions = mockPaymentData
    .filter((p) => p.status === "Successful")
    .reduce((sum, payment) => sum + payment.amountPaid, 0);
  const failedTransactions = mockPaymentData.filter(
    (p) => p.status === "Failed"
  ).length;
  const totalRefunds = mockPaymentData
    .filter((p) => p.status === "Refunded")
    .reduce(
      (sum, payment) => sum + (payment.refundAmount || payment.amountPaid),
      0
    );

  const handleViewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Payments</h1>
          <p className="text-slate-600">
            Track and monitor payment transactions across your portfolio
          </p>
        </div>
        <Button variant="outline" className="border-slate-200">
          <Download className="w-4 h-4 mr-2" />
          Export Transactions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ₦{(totalPayments / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-slate-600">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ₦{(successfulTransactions / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-slate-600">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {failedTransactions}
                </p>
                <p className="text-sm text-slate-600">Failed Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RotateCcw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ₦{(totalRefunds / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-slate-600">Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search payments, tenants, or transaction refs..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 ml-4"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Property
                    </label>
                    <Select
                      value={propertyFilter}
                      onValueChange={setPropertyFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Properties</SelectItem>
                        <SelectItem value="Sunset Apartments">
                          Sunset Apartments
                        </SelectItem>
                        <SelectItem value="Ocean View Towers">
                          Ocean View Towers
                        </SelectItem>
                        <SelectItem value="Marina Heights">
                          Marina Heights
                        </SelectItem>
                        <SelectItem value="City Centre Plaza">
                          City Centre Plaza
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Payment Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Successful">Successful</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Date Range
                    </label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Dates</SelectItem>
                        <SelectItem value="Today">Today</SelectItem>
                        <SelectItem value="This Week">This Week</SelectItem>
                        <SelectItem value="This Month">This Month</SelectItem>
                        <SelectItem value="Last Month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setStatusFilter("All");
                        setPropertyFilter("All");
                        setDateFilter("All");
                        setLocalSearchTerm("");
                      }}
                    >
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Payment Transactions Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Payment ID
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Tenant Name
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Property
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Amount Paid
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Payment Method
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Date & Time
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentData.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewPaymentDetails(payment)}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {payment.paymentId}
                        </p>
                        <p className="text-sm text-slate-500">
                          {payment.transactionRef}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {payment.tenantName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {payment.tenantEmail}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">{payment.property}</td>
                    <td className="p-4 font-medium text-slate-900">
                      ₦{payment.amountPaid.toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-700">
                      {payment.paymentMethod}
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`${getStatusColor(
                          payment.status
                        )} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div>
                        <p>
                          {(() => {
                            const date = new Date(payment.dateTime);
                            return isNaN(date.getTime())
                              ? "Invalid date"
                              : date.toLocaleDateString();
                          })()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {(() => {
                            const date = new Date(payment.dateTime);
                            return isNaN(date.getTime())
                              ? ""
                              : date.toLocaleTimeString();
                          })()}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPaymentDetails(payment);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredPaymentData.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No payment transactions found
            </h3>
            <p className="text-slate-600">
              {effectiveSearchTerm
                ? "Try adjusting your search or filters."
                : "No payment transactions available."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
      />
    </div>
  );
}
