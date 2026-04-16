declare module "@paystack/inline-js" {
  interface PaystackPopOptions {
    onSuccess?: (transaction: {
      reference: string;
      [key: string]: unknown;
    }) => void;
    onCancel?: () => void;
    onClose?: () => void;
  }

  class PaystackPop {
    resumeTransaction(accessCode: string, options?: PaystackPopOptions): void;
    checkout(options: {
      key: string;
      email: string;
      amount: number;
      ref?: string;
      onSuccess?: (transaction: { reference: string }) => void;
      onCancel?: () => void;
      onClose?: () => void;
    }): void;
  }

  export default PaystackPop;
}
