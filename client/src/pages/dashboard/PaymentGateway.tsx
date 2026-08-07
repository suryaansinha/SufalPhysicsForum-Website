import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import type { MyFees } from '../../types';
import { fetchMyFees, payFee } from '../../lib/api';

const MONTHS = [
  'January 2026', 'February 2026', 'March 2026', 'April 2026',
  'May 2026', 'June 2026', 'July 2026', 'August 2026',
  'September 2026', 'October 2026', 'November 2026', 'December 2026'
];

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'BANK_TRANSFER', label: 'Net Banking' },
  { value: 'CASH', label: 'Cash at Institute' },
];

const inputClass =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function PaymentGateway() {
  const [myFees, setMyFees] = useState<MyFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [amount, setAmount] = useState('');
  const [monthFor, setMonthFor] = useState(MONTHS[new Date().getMonth()]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetchMyFees()
      .then((data) => {
        if (!active) return;
        setMyFees(data);
        const first = data.enrollments[0];
        if (first) {
          setSelectedBatchId(first.batch.id);
          if (first.batch.feeAmount != null) {
            setAmount(String(first.batch.feeAmount));
          }
        }
      })
      .catch(() => {
        if (active) setMessage({ type: 'error', text: 'Failed to load your fee details.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedEnrollment = useMemo(
    () => myFees?.enrollments.find((e) => e.batch.id === selectedBatchId),
    [myFees, selectedBatchId]
  );

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const enrollment = myFees?.enrollments.find((e) => e.batch.id === batchId);
    if (enrollment?.batch.feeAmount != null) {
      setAmount(String(enrollment.batch.feeAmount));
    } else {
      setAmount('');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !amount || !monthFor) return;
    setPaying(true);
    setMessage(null);
    try {
      await payFee({
        batchId: selectedBatchId,
        amount: parseFloat(amount),
        paymentMethod,
        monthFor,
        transactionId: `TXN${Date.now()}`,
      });
      const refreshed = await fetchMyFees();
      setMyFees(refreshed);
      setMessage({
        type: 'success',
        text: `Payment of ₹${parseFloat(amount)} received successfully for ${monthFor}.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Payment failed. Please try again.',
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const enrollments = myFees?.enrollments ?? [];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Fee Payment</h3>
        <p className="text-sm text-gray-500 mt-1">Pay your monthly fees securely</p>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-gray-500 mt-4">You are not enrolled in any batch yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-semibold text-gray-900">Payment Details</h4>
            </div>

            <form onSubmit={handlePay} className="space-y-5">
              <div>
                <label className={labelClass}>Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className={inputClass}
                  required
                >
                  {enrollments.map((enrollment) => (
                    <option key={enrollment.batch.id} value={enrollment.batch.id}>
                      {enrollment.batch.name}
                      {enrollment.batch.gradeLevel ? ` - Class ${enrollment.batch.gradeLevel}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEnrollment?.batch.timing && (
                <p className="text-xs text-gray-500">
                  Batch timing: {selectedEnrollment.batch.timing}
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClass}
                    min="1"
                    step="0.01"
                    placeholder="0"
                    required
                  />
                  {selectedEnrollment?.batch.feeAmount != null && (
                    <p className="text-xs text-gray-500 mt-1">
                      Monthly fee: ₹{selectedEnrollment.batch.feeAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Payment For Month</label>
                  <select
                    value={monthFor}
                    onChange={(e) => setMonthFor(e.target.value)}
                    className={inputClass}
                    required
                  >
                    {MONTHS.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Payment Method</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center justify-center px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        paymentMethod === method.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {paying ? 'Processing...' : `Pay ₹${amount || '0'}`}
              </button>
              <p className="text-center text-xs text-gray-400">
                Demo secure checkout - payments are recorded against your account.
              </p>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-base font-semibold text-gray-900">Payment History</h4>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {(myFees?.payments?.length ?? 0) === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-500">No payments yet.</p>
              ) : (
                myFees?.payments.map((payment) => (
                  <div key={payment.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{payment.amount}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {payment.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{payment.monthFor}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-gray-500">{payment.paymentMethod.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
