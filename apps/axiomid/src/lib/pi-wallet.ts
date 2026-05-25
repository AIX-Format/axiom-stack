export interface PiPayment {
  identifier: string;
  amount: number;
  memo: string;
  status: 'pending' | 'completed' | 'failed';
  fromAddress: string;
  toAddress: string;
  createdAt: string;
}

export interface PiWalletState {
  connected: boolean;
  walletAddress: string | null;
  balance: number | null;
}

export interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

async function getPi(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('Pi SDK only in browser');
  const Pi = (window as any).Pi;
  if (!Pi?.authenticate || !Pi?.createPayment) throw new Error('Pi SDK not loaded');
  return Pi;
}

export async function connectPiWallet(): Promise<PiAuthResult> {
  const Pi = await getPi();
  
  const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === "true" || 
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sandbox") === "true");

  const scopes = isSandbox
    ? ['username', 'payments']
    : ['username', 'payments', 'wallet_address'];

  const result = await Pi.authenticate(
    scopes,
    (payment: any) => {
      console.warn('Incomplete Pi payment found:', payment.identifier);
    }
  );

  return {
    accessToken: result.accessToken,
    user: { uid: result.user.uid, username: result.user.username },
  };
}

export async function createPiPayment(amount: number, memo: string, metadata?: Record<string, unknown>): Promise<PiPayment> {
  const Pi = await getPi();

  return new Promise<PiPayment>((resolve, reject) => {
    Pi.createPayment({
      amount,
      memo,
      metadata: metadata || {},
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        try {
          const res = await fetch('/api/pi/payment/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
          if (!res.ok) throw new Error('Failed to approve payment with backend');
          console.log('[Pi Payment] Payment approved on backend:', paymentId);
        } catch (err) {
          console.error('[Pi Payment] Error in onReadyForServerApproval:', err);
          reject(err);
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        try {
          const res = await fetch('/api/pi/payment/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          if (!res.ok) throw new Error('Failed to complete payment with backend');
          const data = await res.json();
          console.log('[Pi Payment] Payment completed successfully:', data);
          
          resolve({
            identifier: paymentId,
            amount,
            memo,
            status: 'completed',
            fromAddress: '',
            toAddress: '',
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[Pi Payment] Error in onReadyForServerCompletion:', err);
          reject(err);
        }
      },
      onCancel: (paymentId: string) => {
        console.warn('[Pi Payment] Payment cancelled by user:', paymentId);
        reject(new Error('Payment cancelled by user'));
      },
      onError: (error: Error, payment?: any) => {
        console.error('[Pi Payment] Payment error:', error, payment);
        reject(error || new Error('Payment error occurred'));
      }
    });
  });
}
