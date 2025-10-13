import React, { useEffect } from "react";
import SectionCard from "../../../components/ui/SectionCard";
import CustomSelect from "../../../components/ui/SearchSelect";
import { _lowercase } from "zod/v4/core";
import nos from "../../../utils/nos";

const cURLHOST = import.meta.env.VITE_API_BASE_URL;

type OptionType = {
  value: string;
  label: string;
};

interface FinancialDetailsResponse {
  currencyPair: string;
  valueType: string;
  actualValueBaseCurrency: number | null;
  inputValue: number | null;
  spotRate: number | null;
  forwardPoints: number | null;
  valueBaseCurrency: string | null;
  bankMargin: number | null;
  totalRate: number | null;
  valueQuoteCurrency: number | null;
  interveningRateQuoteToLocal: number | null;
  valueLocalCurrency: number | null;
  baseCurrency: string;
  quoteCurrency: string;
}

interface FinancialDetailsProps {
  formData: FinancialDetailsResponse;
  setFormData: React.Dispatch<React.SetStateAction<FinancialDetailsResponse>>;
  currencyPairs: OptionType[];
  isLoading: boolean;
  orderType?: string;
  partial?: boolean;
}

const valueTypeOptions: OptionType[] = [
  { value: "Actual", label: "Actual" },
  { value: "Millions", label: "Millions" },
  { value: "Thousands", label: "Thousands" },
];

const mockCurrencyPairs: OptionType[] = [
  { value: "USDINR", label: "USD/INR" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
];

const FinancialDetails: React.FC<FinancialDetailsProps> = ({
  formData,
  setFormData,
  partial,
  isLoading,
  orderType,
}) => {
  const getValueTypeMultiplier = (valueType: string): number => {
    switch (valueType) {
      case "Actual":
        return 1;
      case "Thousands":
        return 1000;
      case "Millions":
        return 1000000;
      default:
        return 1;
    }
  };

  // Extract base and quote
  useEffect(() => {
    if (formData.currencyPair.length >= 6) {
      const base = formData.currencyPair.slice(0, 3);
      const quote = formData.currencyPair.slice(3, 6);
      setFormData((prev) => ({
        ...prev,
        baseCurrency: base,
        quoteCurrency: quote,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        baseCurrency: "",
        quoteCurrency: "",
      }));
    }
  }, [formData.currencyPair, setFormData]);

  // Calculate total rate
  useEffect(() => {
    const { spotRate, forwardPoints, bankMargin } = formData;
    if (
      orderType &&
      spotRate !== null &&
      forwardPoints !== null &&
      bankMargin !== null
    ) {
      let totalRate: number;
      if (orderType.toLowerCase() === "buy") {
        totalRate = spotRate + forwardPoints + bankMargin;
      } else if (orderType.toLowerCase() === "sell") {
        totalRate = spotRate + forwardPoints - bankMargin;
      } else return;
      setFormData((prev) => ({ ...prev, totalRate }));
    }
  }, [
    formData.spotRate,
    formData.forwardPoints,
    formData.bankMargin,
    orderType,
    setFormData,
  ]);

  // Value Quote + Local
  useEffect(() => {
    const { valueQuoteCurrency, interveningRateQuoteToLocal } = formData;
    if (
      valueQuoteCurrency !== null &&
      interveningRateQuoteToLocal !== null &&
      !isNaN(valueQuoteCurrency) &&
      !isNaN(interveningRateQuoteToLocal)
    ) {
      const valueLocalCurrency =
        interveningRateQuoteToLocal * valueQuoteCurrency;
      setFormData((prev) => ({ ...prev, valueLocalCurrency }));
    }
  }, [
    formData.valueQuoteCurrency,
    formData.interveningRateQuoteToLocal,
    setFormData,
  ]);

  // Auto-calculate Value (Base Currency) = Input Value × Multiplier
  useEffect(() => {
    const { actualValueBaseCurrency, valueType } = formData;
    if (
      actualValueBaseCurrency !== null &&
      valueType &&
      !isNaN(actualValueBaseCurrency)
    ) {
      const multiplier = getValueTypeMultiplier(valueType);
      const inputValue = actualValueBaseCurrency * multiplier;
      setFormData((prev) => ({ ...prev, inputValue }));
    }
  }, [formData.actualValueBaseCurrency, formData.valueType, setFormData]);

  // // Auto-calculate Value (Quote Currency) = Value (Base Currency) × Total Rate
  useEffect(() => {
    const { inputValue, totalRate } = formData;
    if (
      inputValue !== null &&
      totalRate !== null &&
      !isNaN(inputValue) &&
      !isNaN(totalRate)
    ) {
      const valueQuoteCurrency = inputValue * totalRate;
      setFormData((prev) => ({ ...prev, valueQuoteCurrency }));
    }
  }, [formData.inputValue, formData.totalRate, formData.valueType,setFormData]);

  // Auto-fill Intervening Rate (Quote to Local) to 1 and disable if both currencies are INR
  useEffect(() => {
    const isSame =
      String(formData.quoteCurrency || "").trim().toLowerCase() ===
      String(formData.valueBaseCurrency || "").trim().toLowerCase();

    if (isSame) {
      if (formData.interveningRateQuoteToLocal !== 1) {
        setFormData((prev) => ({
          ...prev,
          interveningRateQuoteToLocal: 1,
        }));
      }
    } else {
      if (formData.interveningRateQuoteToLocal !== null) {
        setFormData((prev) => ({
          ...prev,
          interveningRateQuoteToLocal: null,
        }));
      }
    }
  }, [
    formData.quoteCurrency,
    formData.valueBaseCurrency,
    setFormData,
  ]);

  // Fetch default local currency from API and autopopulate valueBaseCurrency if empty
  useEffect(() => {
    if (!formData.valueBaseCurrency) {
      const fetchDefaultCurrency = async () => {
        try {
          const response = await nos.get(`${cURLHOST}/dash/cfo/fwd/localcurr`);
          const data = response.data as any;
          if (data?.defaultCurrency) {
            setFormData((prev) => ({
              ...prev,
              valueBaseCurrency: data.defaultCurrency,
            }));
          }
        } catch (error) {
          // fallback: do nothing if API fails
          console.error("Failed to fetch default currency:", error);
        }
      };
      
      fetchDefaultCurrency();
    }
  }, [formData.valueBaseCurrency, setFormData]);

  return (
    <SectionCard title="Financial Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Currency Pair */}
        <CustomSelect
          label="Currency Pair"
          options={mockCurrencyPairs}
          selectedValue={formData.currencyPair}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, currencyPair: val }))
          }
          isDisabled={isLoading || partial}
          isClearable={false}
          placeholder="Choose..."
        />

        {/* Value Type */}
        <CustomSelect
          label="Value Type"
          options={valueTypeOptions}
          selectedValue={formData.valueType}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, valueType: val }))
          }
          isDisabled={isLoading || partial}
          isClearable={false}
          isRequired
          placeholder="Choose..."
        />

        {/* Multiplier Applied - stays in grid but empty when no valueType */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Multiplier Applied
          </label>
          <input
            type="text"
            value={
              formData.valueType
                ? `×${getValueTypeMultiplier(
                    formData.valueType
                  ).toLocaleString()}`
                : "—"
            }
            className="h-[37px] border p-2 bg-blue-50 text-blue-800 rounded border-border"
            disabled
          />
        </div>

        {/* Base Currency */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Base Currency
          </label>
          <input
            type="text"
            value={formData.baseCurrency || ""}
            disabled
            className="h-[37px] border p-2 bg-secondary-color-dark text-secondary-text-dark rounded border-border"
            placeholder="Auto Fill"
          />
        </div>

        {/* Quote Currency */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Quote Currency
          </label>
          <input
            type="text"
            value={formData.quoteCurrency || ""}
            disabled
            className="h-[37px] border p-2 bg-secondary-color-dark text-secondary-text-dark rounded border-border"
            placeholder="Auto Fill"
          />
        </div>

        {/* Local Currency */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Local Currency
          </label>
          <input
            type="text"
            value={formData.valueBaseCurrency || ""}
            disabled
            className="h-[37px] border p-2 bg-secondary-color-dark text-secondary-text-dark rounded border-border"
            placeholder="Auto Fill"
          />
        </div>

        {/* Dynamic fields */}
        {[
          {
            key: "actualValueBaseCurrency",
            label: "Input Value",
            disabled: false,
            isMultiplied: true,
            format: (val: number | null) =>
              val !== null && !isNaN(val) ? val.toLocaleString("en-IN") : "",
          },
          {
            key: "inputValue",
            label: "Booking Amount",
            disabled: true,
            placeholder: "Auto Fill",
            format: (val: number | null) =>
              val !== null && !isNaN(val) ? val.toLocaleString("en-IN") : "",
          },

          {
            key: "spotRate",
            label: "Spot Rate",
            disabled: false,
            isMultiplied: false,
          },
          {
            key: "forwardPoints",
            label: "Forward Points",
            disabled: false,
            isMultiplied: false,
          },
          {
            key: "bankMargin",
            label: "Bank Margin",
            disabled: false,
            isMultiplied: false,
          },
          {
            key: "totalRate",
            label: "Total Rate",
            disabled: true,
            isMultiplied: false,
            placeholder: "Auto Fill",
          },
          {
            key: "valueQuoteCurrency",
            label: "Value (Quote Currency)",
            disabled: true,
            isMultiplied: true,
            placeholder: "Auto Fill",
            format: (val: number | null) =>
              val !== null && !isNaN(val) ? val.toLocaleString("en-IN") : "",
          },
          {
            key: "interveningRateQuoteToLocal",
            label: "Intervening Rate (Quote to Local)",
            // Disable if both quote and base currency are INR
            disabled:
              String(formData.quoteCurrency || "").trim().toLowerCase() ===
              String(formData.valueBaseCurrency || "").trim().toLowerCase(),
          },
          {
            key: "valueLocalCurrency",
            label: "Value (Local Currency)",
            disabled: true,
            isMultiplied: true,
            placeholder: "Auto Fill",
            format: (val: number | null) =>
              val !== null && !isNaN(val) ? val.toLocaleString("en-IN") : "",
          },
        ].map((field, idx) => (
          <div key={idx} className="flex flex-col w-full">
            <label className="text-sm text-secondary-text mb-1 flex items-center justify-between">
              <span>{field.label}</span>
              {field.isMultiplied && formData.valueType && (
                <span className="text-blue-600 text-xs ml-2 whitespace-nowrap">
                  ×{getValueTypeMultiplier(formData.valueType).toLocaleString()}
                </span>
              )}
            </label>
            <input
              type="text"
              className={`h-[37px] border p-2 rounded border-border w-full ${
                field.disabled || isLoading
                  ? "bg-secondary-color-dark text-secondary-text-dark"
                  : "text-secondary-text-dark"
              }`}
              value={
                field.format
                  ? field.format(formData[field.key as keyof FinancialDetailsResponse] as number | null)
                  : formData[field.key as keyof FinancialDetailsResponse] ?? ""
              }
              onChange={(e) => {
                if (!field.disabled) {
                  let value = e.target.value.replace(/,/g, "");
                  // For Input Value, allow only numbers
                  if (field.key === "actualValueBaseCurrency") {
                    if (/^\d*$/.test(value)) {
                      setFormData((prev) => ({
                        ...prev,
                        [field.key]: value === "" ? null : Number(value),
                      }));
                    }
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: value === "" ? null : Number(value),
                    }));
                  }
                }
              }}
              required
              disabled={isLoading || field.disabled}
              placeholder={field.placeholder || ""}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default FinancialDetails;