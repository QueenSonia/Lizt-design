"use client";

import { useEffect, useState } from "react";
import {
  kycFeedbackService,
  FeedbackStatistics,
} from "@/services/kyc-feedback/kyc-feedback.service";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_KYC_ADMIN_PASSWORD || "admin123";

export default function KYCFeedbackPage() {
  const [statistics, setStatistics] = useState<FeedbackStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already authenticated in session
    const authenticated = sessionStorage.getItem("kyc_admin_auth") === "true";
    if (authenticated) {
      setIsAuthenticated(true);
      fetchStatistics();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const data = await kycFeedbackService.getAdminStatistics();
      console.log("Feedback data:", data); // Debug log to see what data we're getting
      setStatistics(data);
    } catch (error: unknown) {
      console.error("Failed to fetch feedback statistics:", error);
      toast.error("Failed to load feedback statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error("Please enter the admin password");
      return;
    }

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("kyc_admin_auth", "true");
      setIsAuthenticated(true);
      setPassword("");
      toast.success("Access granted");
      fetchStatistics();
    } else {
      toast.error("Invalid password");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("kyc_admin_auth");
    setIsAuthenticated(false);
    setStatistics(null);
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-[#FF5000] p-3 rounded-full">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Admin Access Required
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Enter the admin password to view all KYC feedback
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Admin Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF5000] hover:bg-[#E04500] text-white"
            >
              Access Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No feedback data available</p>
      </div>
    );
  }

  const { recentFeedbacks } = statistics;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          KYC Feedback Reviews
        </h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-gray-600 hover:text-gray-900"
        >
          Logout
        </Button>
      </div>

      {recentFeedbacks.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No feedback received yet
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentFeedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= feedback.rating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold text-gray-900">
                    {feedback.rating}
                  </span>
                </div>

                <div className="mb-1">
                  <p className="font-medium text-gray-900">
                    {feedback.tenant_name || "Unknown User"}
                  </p>
                  {/* {feedback.tenant_email && (
                    <p className="text-sm text-gray-600">
                      {feedback.tenant_email}
                    </p>
                  )} */}
                  {feedback.property_name && (
                    <p className="text-xs text-gray-500">
                      Property: {feedback.property_name}
                    </p>
                  )}
                </div>

                {feedback.comment && (
                  <p className="text-gray-700 text-sm mb-3">
                    {feedback.comment}
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  {new Date(feedback.submitted_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
