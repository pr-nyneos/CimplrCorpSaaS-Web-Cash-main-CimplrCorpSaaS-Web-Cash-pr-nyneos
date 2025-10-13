import React from "react";
import Button from "../../../components/ui/Button";
import { CURRENCY_DATA } from "../../../constant/constants";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
export interface Currency {
  currencyCode: string;
  currencyName: string;
  country: string;
  symbol: string;
}

function SplitDrawer({
  open,
  onClose,
  row,
  onSave,
  accountOptions,
  // accountBalances,
}: {
  open: boolean;
  onClose: () => void;
  row: any;
  onSave: (splits: any) => void;
  accountOptions: { value: string; label: string }[];
  // accountBalances: Record<string, number>;
}) {
  const  {notify}  = useNotification();
  const totalAmount = row?.total_amount || 0;
  const currency = row?.currency || "USD";

  // Initialize splits from proposed_allocation if available
  const initialSplits = React.useMemo(() => {
    if (row?.proposed_allocation && row.proposed_allocation.length > 0) {
      return row.proposed_allocation.map((alloc: any) => ({
        account: alloc.account_id,
        amount: Math.round((alloc.pct / 100) * totalAmount)
      }));
    }
    return [{ account: "", amount: totalAmount }];
  }, [row, open, totalAmount]);

  const [splits, setSplits] = React.useState<{ account: string; amount: number }[]>(initialSplits);
  const [editingAmountIndex, setEditingAmountIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setSplits(initialSplits);
  }, [initialSplits]);

  type Split = { account: string; amount: number };

  const handleSplitChange = (
    index: number,
    key: keyof Split,
    value: string | number
  ) => {
    setSplits(prev => {
      const newSplits = [...prev];
      if (key === "amount") {
        const otherTotal = newSplits.reduce((sum, s, i) => i !== index ? sum + s.amount : sum, 0);
        const max = totalAmount - otherTotal;
        let newValue = typeof value === "number" ? value : parseFloat(value as string) || 0;
        
        // Ensure value doesn't exceed maximum
        if (newValue > max) newValue = max;
        if (newValue < 0) newValue = 0;
        
        newSplits[index][key] = newValue;
      } else {
        newSplits[index][key] = value as string;
      }
      return newSplits;
    });
  };

  const handleSliderChange = (index: number, pct: number) => {
    setSplits(prev => {
      const newSplits = [...prev];
      const newAmount = Math.round((pct / 100) * totalAmount);
      
      // Calculate other splits total
      const otherTotal = newSplits.reduce((sum, s, i) => i !== index ? sum + s.amount : sum, 0);
      const maxAmount = totalAmount - otherTotal;
      
      // Ensure we don't exceed total
      newSplits[index].amount = Math.min(newAmount, maxAmount);
      return newSplits;
    });
  };

  const addSplit = () => {
    if (splits.length >= accountOptions.length) {
      notify("No more accounts available","warning");
      return;
    }
    setSplits(prev => [...prev, { account: "", amount: 0 }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 1) {
      notify("At least one split is required", "warning");
      return;
    }
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const currentSum = splits.reduce((sum, s) => sum + s.amount, 0);
  const isValid = Math.abs(currentSum - totalAmount) < 0.01; // Allow small floating point differences
  const anyUnselected = splits.some(s => !s.account);
  const canAddMore = accountOptions.length > splits.length;

  function getCurrencySymbol(currencyCode: string) {
    const currency = CURRENCY_DATA.find(
      (c: Currency) => c.currencyCode === currencyCode
    );
    return currency ? currency.symbol : currencyCode;
  }

  const handleApplySplit = () => {
    if (!isValid) {
      notify("Total allocated amount must equal the group total","error");
      return;
    }
    
    if (anyUnselected) {
      notify("Please select an account for all splits", "error");
      return;
    }

    onSave(splits);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 w-full max-w-2xl h-full shadow-2xl p-8 relative overflow-y-auto rounded-l-xl">
        <button
          className="absolute top-6 right-6 text-2xl bg-slate-100 hover:bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center shadow transition"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        
        <h2 className="text-2xl font-extrabold mb-2 text-primary">Split Allocation</h2>
        <div className="mb-2 text-gray-700 text-base">
          <span className="font-semibold">For Group:</span> {row?.group_label || "(unnamed)"}
        </div>
        <div className="mb-6 text-gray-700 text-base">
          <span className="font-semibold">Total Amount:</span>{" "}
          <span className="text-primary font-bold text-lg">
            {getCurrencySymbol(currency)}{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <div className={`text-sm mt-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            Allocated: {getCurrencySymbol(currency)}{currentSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })} 
            ({((currentSum / totalAmount) * 100).toFixed(1)}%)
            {!isValid && " - Must equal 100%"}
          </div>
        </div>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          {splits.map((split, index) => {
            const selectedAccounts = splits
              .map((s, i) => (i !== index ? s.account : null))
              .filter(account => account);

            const availableOptions = accountOptions.filter(
              opt => !selectedAccounts.includes(opt.value)
            );

            const accountData = row?.suggested_accounts?.find(acc => acc.id === split.account);
            const confidence = accountData?.confidence ?? 0;
            const percentage = totalAmount > 0 ? (split.amount / totalAmount) * 100 : 0;

            return (
              <div
                key={index}
                className="mb-4 bg-white/80 rounded-xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md relative"
              >
                {splits.length > 1 && (
                  <button
                    type="button"
                    className="absolute top-3 right-3 text-red-500 text-xl hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center transition"
                    onClick={() => removeSplit(index)}
                    title="Remove split"
                  >
                    ×
                  </button>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Account</label>
                    <select
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary focus:border-primary transition"
                      value={split.account}
                      onChange={e => handleSplitChange(index, "account", e.target.value)}
                    >
                      <option value="">Choose Account</option>
                      {availableOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <span className="ml-8 text-xs text-gray-500 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">Confidence:</span>{" "}
                    <span className={`font-bold ${
                      confidence >= 80 ? 'text-green-700' : 
                      confidence >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {confidence}%
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(percentage)}
                    onChange={e => handleSliderChange(index, Number(e.target.value))}
                    className="flex-1 accent-primary h-2 rounded-lg bg-slate-200"
                    disabled={!split.account}
                  />
                  
                  <span className="w-35 text-right font-semibold text-slate-700">
                    <span className="text-primary">
                      {split.account ? percentage.toFixed(0) : 0}%
                    </span>
                    {" | "}
                    {editingAmountIndex === index ? (
                      <input
                        type="number"
                        min={0}
                        max={totalAmount}
                        step={100}
                        value={split.account ? split.amount : 0}
                        autoFocus
                        className="w-24 px-1 py-0.5 border border-primary rounded text-right font-bold text-primary-lt"
                        onChange={e => handleSplitChange(index, "amount", Number(e.target.value))}
                        onBlur={() => setEditingAmountIndex(null)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === "Escape") setEditingAmountIndex(null);
                        }}
                        disabled={!split.account}
                      />
                    ) : (
                      <span
                        className={`cursor-pointer px-1 rounded text-primary-lt ${
                          split.account ? 'bg-primary/10 hover:bg-primary/20' : 'bg-gray-100'
                        }`}
                        onClick={() => split.account && setEditingAmountIndex(index)}
                        title={split.account ? "Click to edit amount" : "Select an account first"}
                      >
                        {split.account && accountData?.currency
                          ? getCurrencySymbol(accountData.currency)
                          : ""}
                        {split.account ? split.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : 0}
                      </span>
                    )}
                  </span>
                </div>

                {/* Account warnings */}
                {split.account && accountData?.warnings && accountData.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    <strong>Warnings:</strong>
                    <ul className="list-disc ml-4">
                      {accountData.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          <div className="grid grid-cols-2 justify-between items-center mt-4">
            <button
              type="button"
              className={`justify-self-start text-sm font-semibold transition ${
                canAddMore 
                  ? 'text-primary underline hover:text-primary/80' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              onClick={addSplit}
              disabled={!canAddMore}
            >
              + Add Another Account
            </button>
            
            <div className="flex gap-4">
              <Button color="Fade" onClick={onClose}>Cancel</Button>
              <Button 
                color="Green" 
                disabled={!isValid || anyUnselected} 
                onClick={handleApplySplit}
              >
                Apply Split
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SplitDrawer;