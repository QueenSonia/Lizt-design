/* eslint-disable */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  CalendarIcon,
  DollarSign,
  Calendar as CalendarIconLucide,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { KYCApplication, TenancyDetails } from "@/services/kyc/kyc.service";

const tenancyDetailsSchema = z.object({
  rentAmount: z.number().min(1, "Rent amount is required"),

  rentFrequency: z.enum(["monthly", "quarterly", "bi-annually", "annually"], {
    required_error: "Please select a rent frequency",
  }),
  tenancyStartDate: z
    .date()
    .optional()
    .refine(
      (date) => {
        if (!date) return true; // Optional field
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: "Start date cannot be in the past" }
    ),
});

type TenancyDetailsForm = z.infer<typeof tenancyDetailsSchema>;

interface AttachTenantModalProps {
  application: KYCApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onAttach: (details: TenancyDetails) => Promise<void>;
  isLoading?: boolean;
}

export function AttachTenantModal({
  application,
  isOpen,
  onClose,
  onAttach,
  isLoading = false,
}: AttachTenantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenancyDetailsForm>({
    resolver: zodResolver(tenancyDetailsSchema),
    defaultValues: {
      rentFrequency: "monthly",
    },
  });

  const watchedStartDate = watch("tenancyStartDate");

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: TenancyDetailsForm) => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      // Calculate start date (default to today if not provided)
      const startDate = data.tenancyStartDate || new Date();

      const tenancyDetails: TenancyDetails = {
        rentAmount: data.rentAmount,
        rentFrequency: data.rentFrequency,
        tenancyStartDate: startDate.toISOString().split("T")[0],
      };

      await onAttach(tenancyDetails);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error attaching tenant:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ""));
    if (isNaN(numericAmount)) return amount;

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(numericAmount);
  };

  const getRentFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly (3 months)";
      case "bi-annually":
        return "Bi-annually (6 months)";
      case "annually":
        return "Annually (12 months)";
      default:
        return frequency;
    }
  };

  if (!application) return null;

  const fullName = `${application.firstName} ${application.lastName}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Attach Tenant
          </DialogTitle>
          <DialogDescription>
            Set up tenancy details for <strong>{fullName}</strong>. This will
            create an active tenancy and update the property status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Applicant Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Applicant Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="text-gray-900">{fullName}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="text-gray-900">{application.phoneNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="text-gray-900">{application.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Monthly Income:</span>
                <p className="text-gray-900">
                  {formatCurrency(application.monthlyNetIncome)}
                </p>
              </div>
            </div>
          </div>

          {/* Tenancy Details Form */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Tenancy Details</h4>

            {/* Rent Amount */}
            <div className="space-y-2">
              <Label htmlFor="rentAmount">
                Rent Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rentAmount"
                type="number"
                placeholder="Enter rent amount"
                {...register("rentAmount", { valueAsNumber: true })}
                className={cn(errors.rentAmount && "border-red-500")}
              />
              {errors.rentAmount && (
                <p className="text-sm text-red-500">
                  {errors.rentAmount.message}
                </p>
              )}
            </div>



            {/* Rent Frequency */}
            <div className="space-y-2">
              <Label htmlFor="rentFrequency">
                Rent Frequency <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    "rentFrequency",
                    value as
                    | "monthly"
                    | "quarterly"
                    | "bi-annually"
                    | "annually"
                  )
                }
                defaultValue="monthly"
              >
                <SelectTrigger
                  className={cn(errors.rentFrequency && "border-red-500")}
                  aria-label="Rent Frequency"
                >
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">
                    Quarterly (3 months)
                  </SelectItem>
                  <SelectItem value="bi-annually">
                    Bi-annually (6 months)
                  </SelectItem>
                  <SelectItem value="annually">Annually (12 months)</SelectItem>
                </SelectContent>
              </Select>
              {errors.rentFrequency && (
                <p className="text-sm text-red-500">
                  {errors.rentFrequency.message}
                </p>
              )}
            </div>

            {/* Tenancy Start Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="tenancyStartDate">
                Tenancy Start Date (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedStartDate ? (
                      format(watchedStartDate, "PPP")
                    ) : (
                      <span>Pick a start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedStartDate}
                    onSelect={(date) => setValue("tenancyStartDate", date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">
                If ——, tenancy will start from today
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Attaching...
                </>
              ) : (
                "Attach Tenant"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
