import { useState, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { KYCService } from "@/services/kyc/kyc.service";
import { useAuth } from "@/contexts/AuthContext";

interface GenerateKYCLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateKYCLinkModal({
  isOpen,
  onClose,
}: GenerateKYCLinkModalProps) {
  const { user } = useAuth();
  const [kycLink, setKycLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (isOpen && !kycLink && !isGeneratingRef.current && !generationError) {
      generateKYCLink(false);
    } else if (!isOpen) {
      setKycLink(null);
      setGenerationError(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generateKYCLink(isRetry: boolean) {
    if (isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsGeneratingLink(true);
    if (isRetry) {
      setGenerationError(null);
    }
    try {
      const response = await KYCService.generateGeneralKYCLink();
      setKycLink(response.link);
      toast.success("KYC link generated successfully!");
    } catch (error) {
      console.error("KYC token generation failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate KYC link.";
      setGenerationError(message);
      toast.error(message);
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingLink(false);
    }
  }

  const handleCopyLink = () => {
    if (!kycLink) return;
    navigator.clipboard.writeText(kycLink);
    toast.success("Link copied to clipboard");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate KYC Link</DialogTitle>
          <DialogDescription>
            Share this link with potential tenants to let them complete their
            KYC form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="kyc-link" className="text-sm text-gray-700">
              KYC Link for {user?.name || "your account"}
            </Label>
            {isGeneratingLink ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  Generating link...
                </span>
              </div>
            ) : generationError ? (
              <div className="space-y-2">
                <div className="text-red-600 text-sm">{generationError}</div>
                <Button
                  onClick={() => generateKYCLink(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="kyc-link"
                  value={kycLink || ""}
                  readOnly
                  className="flex-1 bg-gray-50 border-gray-200 rounded-xl"
                  placeholder="Link will appear here..."
                />
                <Button
                  onClick={handleCopyLink}
                  disabled={!kycLink}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 flex items-center gap-2 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
