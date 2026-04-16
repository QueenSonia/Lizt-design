/**
 * Success Page Component
 * Post-submission success page with property information and next steps
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Star } from "lucide-react";

import { PropertyInfo } from "../types";
import { BACKGROUND_GRADIENT, BRAND_COLOR } from "../constants/theme";
import { Separator } from "@radix-ui/react-select";
import { Label } from "@radix-ui/react-label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { kycFeedbackService } from "@/services/kyc-feedback/kyc-feedback.service";
import { toast } from "sonner";

export interface SuccessPageProps {
  propertyInfo: PropertyInfo;
  submissionId?: string;
  submissionDate?: Date;
  contactInfo?: {
    phone: string;
    email: string;
    officeHours: string;
  };
  applicantEmail?: string;
  applicantName?: string;
  landlordId?: string;
  onNewApplication?: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  propertyInfo,
  applicantEmail,
  applicantName,
  landlordId,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  return (
    <div
      className={`min-h-screen ${BACKGROUND_GRADIENT} flex items-center justify-center p-4`}
    >
      {/* Success Card - Requirements: 7.1, 7.2 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center"
      >
        {/* Success Icon - Requirements: 7.3 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 10,
          }}
          className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        {/* Success Message */}
        <h2 className="mb-3 text-gray-900 text-2xl font-bold">
          Application Submitted Successfully!
        </h2>
        <p className="text-gray-600 mb-8">
          Thank you for completing your KYC application. Our team will review
          your information and get back to you within 2-3 business days.
        </p>

        {/* Confirmation Message - Requirements: 7.4
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700">
            📧 A confirmation email has been sent to{" "}
            <strong>{applicantEmail}</strong>
          </p>
        </div> */}

        {/* Separator */}
        <Separator className="my-6" />

        {/* Feedback Section */}
        <div className="text-left space-y-4">
          <div>
            <h3 className="text-gray-900 mb-1">
              We&apos;d love your feedback 💬
            </h3>
            <p className="text-sm text-gray-500">
              How was your experience filling out this form?
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex gap-2 justify-center py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-current text-[#FF5000]"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Text Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-sm text-gray-700">
              Tell us how your experience was
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Was anything confusing, frustrating, or easy to use?"
              rows={3}
              className="mt-2 resize-none"
            />
          </div>

          {/* Success Message after submission */}
          {feedbackSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm text-green-800 font-medium">
                ✓ Feedback submitted! Thank you.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="button"
            onClick={async () => {
              if (rating === 0) {
                toast.error("Please select a rating before submitting");
                return;
              }

              setIsSubmitting(true);
              try {
                await kycFeedbackService.submitFeedback({
                  rating,
                  comment: feedback,
                  tenant_email: applicantEmail,
                  tenant_name: applicantName,
                  landlord_id: landlordId,
                  property_name: propertyInfo.name,
                });

                toast.success("Thank you for your feedback!");
                setFeedbackSubmitted(true);
                setIsSubmitting(false);

                // Redirect to landing page after a short delay
                setTimeout(() => {
                  window.location.href = "/";
                }, 1000);
              } catch (error) {
                console.error("Failed to submit feedback:", error);
                toast.error("Failed to submit feedback. Please try again.");
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting || feedbackSubmitted}
            className="w-full h-11 px-6 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#FF5000" }}
          >
            {isSubmitting
              ? "Submitting..."
              : feedbackSubmitted
              ? "Submitted"
              : "Submit & Close"}
          </Button>

          {/* Optional Microcopy */}
          <p className="text-xs text-gray-500 text-center pt-2">
            Your feedback helps us make the process smoother for future tenants.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
