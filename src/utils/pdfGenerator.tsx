import { pdf } from "@react-pdf/renderer";
import { KYCDocumentPDF } from "@/components/pdf/KYCDocumentPDF";
import { IKycApplication } from "@/types/kyc-application";
import { saveAs } from "file-saver";

type KYCApplication = IKycApplication;

/**
 * Generates a high-fidelity PDF for a KYC application using @react-pdf/renderer.
 * 
 * @param application The KYC application data
 * @param propertyName The name of the property associated with the application
 */
export const generateKYCApplicationPDF = async (
  application: KYCApplication,
  propertyName: string
) => {
  try {
    // Generate the PDF blob using the React component
    const blob = await pdf(
      <KYCDocumentPDF application={ application } propertyName = { propertyName } />
    ).toBlob();

    // Save the file using file-saver
    const safeName = (application.name || "Applicant").replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    saveAs(blob, `KYC_Application_${safeName}.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw error;
  }
};
