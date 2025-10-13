import React, { useState, useCallback, useRef } from "react";
import Button from "../../../../components/ui/Button";
import nos from "../../../../utils/nos.tsx";
import OrderDetails from "../../fxComponents/OrderDetails";
import TransactionDetails from "../../fxComponents/TransactionDetails";
import EntityDetails from "../../fxComponents/EntityDetails"
import DealerDetails from "../../fxComponents/DealerDetails";
import DeliveryDateDetails from "../../fxComponents/DeliveryDateDetails";
import FinancialDetails from "../../fxComponents/FinancialDetails";
import AdditionalDetails from "../../fxComponents/AdditionalDetails";
import {useNotification} from "../../../../app/providers/NotificationProvider/Notification.tsx";

import jsPDF from "jspdf";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type EntityState = {
  buEntity0: string | null;
  buEntity1: string | null;
  buEntity2: string | null;
  buEntity3: string | null;
};

type FinancialDetailsResponse = {
  currencyPair: string;
  valueType: string;
  inputValue: number | null; // Added inputValue for booking amount
  actualValueBaseCurrency: number | null;
  spotRate: number | null;
  forwardPoints: number | null;
  bankMargin: number | null;
  valueBaseCurrency: string | null;
  totalRate: number | null;
  valueQuoteCurrency: number | null;
  interveningRateQuoteToLocal: number | null;
  valueLocalCurrency: number | null;
  baseCurrency: string;
  quoteCurrency: string;
};

type OrderState = {
  orderType: string;
  transactionType: string;
  counterparty: string;
  localCurrency: string;
};

interface AdditionalDetailsResponse {
  remarks?: string;
  narration?: string;
  timestamp?: string;
}

type DeliveryDetails = {
  modeOfDelivery: string;
  deliveryPeriod: string;
  addDate: string;
  settlementDate: string;
  maturityDate: string;
  deliveryDate: string;
};

type DealerState = {
  internalDealer: string;
  counterpartyDealer: string;
};

type OptionType = {
  value: string;
  label: string;
};


// API payload type matching the backend requirements
type ApiPayload = {
  internal_reference_id: string;
  entity_level_0: string;
  entity_level_1: string;
  entity_level_2: string;
  entity_level_3: string;
  local_currency: string;
  order_type: string;
  transaction_type: string;
  counterparty: string;
  mode_of_delivery: string;
  delivery_period: string;
  add_date: string;
  settlement_date: string;
  maturity_date: string;
  delivery_date: string;
  currency_pair: string;
  base_currency: string;
  quote_currency: string;
  booking_amount: number;
  value_type: string;
  actual_value_base_currency: number;
  spot_rate: number;
  forward_points: number;
  value_base_currency: string | null; 
  bank_margin: number;
  total_rate: number;
  value_quote_currency: number;
  intervening_rate_quote_to_local: number;
  value_local_currency: number;
  internal_dealer: string;
  counterparty_dealer: string;
  remarks: string;
  narration: string;
  transaction_timestamp: string;
};

const FxForwardBookingForm: React.FC = () => {
  const [transactionInfo, setTransactionInfo] = useState({
    systemTransactionId: "TXN-12345",
    internalReferenceId: "",
  });

  const [dealerInfo, setDealerInfo] = useState<DealerState>({
    internalDealer: "",
    counterpartyDealer: "",
  });

  const [entityValues, setEntityValues] = useState<EntityState>({
    buEntity0: null,
    buEntity1: null,
    buEntity2: null,
    buEntity3: null,
  });

  const [orderDetails, setOrderDetails] = useState<OrderState>({
    orderType: "",
    transactionType: "",
    counterparty: "",
    localCurrency: "INR",
  });

  const [financialData, setFinancialData] = useState<FinancialDetailsResponse>({
    currencyPair: "",
    inputValue: null,
    valueType: "",
    actualValueBaseCurrency: null,
    spotRate: null,
    valueBaseCurrency: "",
    forwardPoints: null,
    bankMargin: null,
    totalRate: null,
    valueQuoteCurrency: null,
    interveningRateQuoteToLocal: null,
    valueLocalCurrency: null,
    baseCurrency: "",
    quoteCurrency: "",
  });

  const [currencyPairs, ] = useState<OptionType[]>([]);
//   const [financialLoading, setFinancialLoading] = useState<boolean>(true);

  // Fetch currency pairs and financial details
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    modeOfDelivery: "",
    deliveryPeriod: "",
    addDate: "",
    settlementDate: "",
    maturityDate: "",
    deliveryDate: "",
  });

  const [additionalDetails, setAdditionalDetails] =
    useState<AdditionalDetailsResponse>({
      remarks: "",
      narration: "",
      timestamp: new Date().toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    });

  const { notify } = useNotification();

  // Loading and error states for API submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [, setSubmitError] = useState<string | null>(null);
  const [, setSubmitSuccess] = useState<boolean>(false);

  const formRef = useRef<HTMLDivElement | null>(null);

  const handleInternalRefChange = useCallback(
    (value: string) => {
      setTransactionInfo((prev) => ({ ...prev, internalReferenceId: value }));
    },
    [setTransactionInfo]
  );

  // Function to extract base and quote currencies from currency pair
  const extractCurrencies = (currencyPair: string) => {
    if (currencyPair.length === 6) {
      return {
        base_currency: currencyPair.substring(0, 3),
        quote_currency: currencyPair.substring(3, 6),
      };
    }
    return { base_currency: "", quote_currency: "" };
  };

  // Function to format date to YYYY-MM-DD format
  const formatDateForApi = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Function to format timestamp to ISO format
  const formatTimestampForApi = (timestamp: string): string => {
    if (!timestamp) return new Date().toISOString();
    try {
      const date = new Date(timestamp);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  // Function to prepare API payload
  const prepareApiPayload = (): ApiPayload => {
    const { base_currency, quote_currency } = extractCurrencies(
      financialData.currencyPair
    );

    // Function to get multiplier based on value type
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

    const multiplier = getValueTypeMultiplier(financialData.valueType);

    // Apply multiplier to financial values with proper number conversion
    const getMultipliedValue = (value: number | null): number => {
      const numValue = Number(value);
      return !isNaN(numValue) && numValue > 0 ? numValue * multiplier : 0;
    };

    // Convert rates to proper numbers
    const getRate = (value: number | null): number => {
      const numValue = Number(value);
      return !isNaN(numValue) ? numValue : 0;
    };

    return {
      internal_reference_id: transactionInfo.internalReferenceId.trim(),
      entity_level_0: entityValues.buEntity0?.trim() || "",
      entity_level_1: entityValues.buEntity1?.trim() || "",
      entity_level_2: entityValues.buEntity2?.trim() || "",
      entity_level_3: entityValues.buEntity3?.trim() || "",
      local_currency: orderDetails.localCurrency.trim(),
      order_type: orderDetails.orderType.trim(),
      transaction_type: orderDetails.transactionType.trim(),
      counterparty: orderDetails.counterparty.trim(),
      mode_of_delivery: deliveryDetails.modeOfDelivery.trim(),
      delivery_period: deliveryDetails.deliveryPeriod.trim() || "",
      add_date: formatDateForApi(deliveryDetails.addDate),
      settlement_date: formatDateForApi(deliveryDetails.settlementDate),
      maturity_date: formatDateForApi(deliveryDetails.maturityDate),
      delivery_date: formatDateForApi(deliveryDetails.deliveryDate),
      currency_pair: financialData.currencyPair.trim(),
      base_currency: (financialData.baseCurrency || base_currency).trim(),
      quote_currency: (financialData.quoteCurrency || quote_currency).trim(),
      value_base_currency : financialData.valueBaseCurrency?.trim() || "",
      booking_amount: getMultipliedValue(financialData.inputValue),
      value_type: financialData.valueType.trim(),
      actual_value_base_currency: getMultipliedValue(
        financialData.actualValueBaseCurrency
      ),
      spot_rate: getRate(financialData.spotRate),
      forward_points: getRate(financialData.forwardPoints),
      bank_margin: getRate(financialData.bankMargin),
      total_rate: getRate(financialData.totalRate),
      value_quote_currency: getMultipliedValue(
        financialData.valueQuoteCurrency
      ),
      intervening_rate_quote_to_local: getRate(
        financialData.interveningRateQuoteToLocal
      ),
      value_local_currency: getMultipliedValue(
        financialData.valueLocalCurrency
      ),
      internal_dealer: dealerInfo.internalDealer.trim(),
      counterparty_dealer: dealerInfo.counterpartyDealer.trim(),
      remarks: additionalDetails.remarks?.trim() || "",
      narration: additionalDetails.narration?.trim() || "",
      transaction_timestamp: formatTimestampForApi(
        additionalDetails.timestamp || ""
      ),
    };
  };

  // Enhanced validation function
  const validateForm = (): string | null => {
    if (!transactionInfo.internalReferenceId)
      return "Internal Reference ID is required";
    if (!orderDetails.orderType) return "Order Type is required";
    if (!orderDetails.transactionType) return "Transaction Type is required";
    if (!orderDetails.counterparty) return "Counterparty is required";
    if (!financialData.currencyPair) return "Currency Pair is required";
    if (!financialData.inputValue || financialData.inputValue <= 0)
      return "Valid booking amount is required";
    if (!deliveryDetails.modeOfDelivery) return "Mode of Delivery is required";

    // Add these additional validations
    if (!dealerInfo.internalDealer) return "Internal Dealer is required";
    if (!dealerInfo.counterpartyDealer)
      return "Counterparty Dealer is required";
    if (!entityValues.buEntity0) return "Entity Level 0 is required";
    if (!financialData.valueType) return "Value Type is required";

    return null;
  };

  // Function to submit the booking
  const handleSubmitBooking = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // Validate form before submission
      const validationError = validateForm();
      if (validationError) {
        notify(validationError, "error");
        setSubmitError(validationError);
        return;
      }

      // Prompt for confirmation and comments
    //   const result = await (window as any).confirm?.(
    //     "Are you sure you want to submit this booking?",
    //     {
    //       input: true,
    //       inputLabel: "Booking Comments (optional)",
    //       inputPlaceholder: "Enter comments...",
    //     }
    //   ) ?? { confirmed: window.confirm("Are you sure you want to submit this booking?") };
    //   if (!result.confirmed) {
    //     setIsSubmitting(false);
    //     return;
    //   }

      // Prepare payload and add comments if provided
      const payload = prepareApiPayload();
    //   if (result.inputValue) {
    //     payload.remarks = result.inputValue;
    //   }
      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      // Submit to API
      const response = await nos.post(
        `${apiBaseUrl}/fx/forwards/manual-entry`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("Response from API:", response.data);
      notify("Booking submitted successfully!", "success");
      setSubmitSuccess(true);
      handleResetForm();
    } catch (error) {
      console.error("Full error details:", error);

      let errorMessage = "An error occurred while submitting the booking";

  // nos does not throw AxiosError, so just log and show a generic error
  notify(errorMessage, "error");
  setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to reset form
  const handleResetForm = () => {
    setTransactionInfo({
      systemTransactionId: "",
      internalReferenceId: "",
    });
    setDealerInfo({
      internalDealer: "",
      counterpartyDealer: "",
    });
    setEntityValues({
      buEntity0: null,
      buEntity1: null,
      buEntity2: null,
      buEntity3: null,
    });
    setOrderDetails({
      orderType: "",
      transactionType: "",
      counterparty: "",
      localCurrency: "INR",
    });
    setFinancialData({
      currencyPair: "",
      inputValue: null,
      valueType: "",
      actualValueBaseCurrency: null,
      spotRate: null,
      forwardPoints: null,
      valueBaseCurrency: "",
      bankMargin: null,
      totalRate: null,
      valueQuoteCurrency: null,
      interveningRateQuoteToLocal: null,
      valueLocalCurrency: null,
      baseCurrency: "",
      quoteCurrency: "",
    });
    setDeliveryDetails({
      modeOfDelivery: "",
      deliveryPeriod: "",
      addDate: "",
      settlementDate: "",
      maturityDate: "",
      deliveryDate: "",
    });
    setAdditionalDetails({
      remarks: "",
      narration: "",
      timestamp: new Date().toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    });
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Updated PDF download function - only show fields with data
  const handlePrintForm = async () => {
    try {
      notify("Generating PDF...", "info");

      // Create PDF with structured data approach (more reliable)
      const pdf = new jsPDF("portrait");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 30;

      // Helper function to add text with page break handling
      const addText = (text: string, x: number, y: number, options?: any) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(text, x, y, options);
        return y + 6;
      };

      // Helper function to check if value has actual data
      const hasValue = (value: any): boolean => {
        return (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          value !== "Not Selected" &&
          value !== "Not Set" &&
          value !== "None" &&
          !(typeof value === "string" && value.trim() === "")
        );
      };

      // Helper function to add section - only show fields with data
      const addSection = (title: string, data: Record<string, any>) => {
        // Filter data to only include fields with actual values
        const filteredData = Object.entries(data).filter(([_, value]) =>
          hasValue(value)
        );

        // Only add section if there's data to show
        if (filteredData.length === 0) return;

        // Section title
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(41, 128, 185);
        yPosition = addText(title, 15, yPosition);

        // Underline
        pdf.setDrawColor(41, 128, 185);
        pdf.line(15, yPosition - 2, pageWidth - 15, yPosition - 2);
        yPosition += 3;

        // Section content
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);

        filteredData.forEach(([key, value]) => {
          const displayValue =
            typeof value === "number" ? value.toLocaleString() : String(value);
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
          yPosition = addText(`${label}: ${displayValue}`, 20, yPosition);
        });
        yPosition += 8;
      };

      // Header
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, 0, pageWidth, 25, "F");
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text("FX Forward Booking Form", pageWidth / 2, 16, {
        align: "center",
      });

      pdf.setFontSize(10);
      pdf.setTextColor(220, 230, 240); // Light gray for subtext

      pdf.text(
        `Internal Ref ID: ${transactionInfo.internalReferenceId || "—"}`,
        pageWidth / 2,
        20,
        { align: "center" }
      );

      // Generation info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      yPosition = addText(
        `Generated: ${new Date().toLocaleString()}`,
        15,
        yPosition
      );
      yPosition += 10;

      // Add all sections with form data - only non-empty fields
      addSection("Transaction Details", {
        "System Transaction ID": transactionInfo.systemTransactionId,
        "Internal Reference ID": transactionInfo.internalReferenceId,
      });

      addSection("Entity Details", {
        "Entity Level 0": entityValues.buEntity0,
        "Entity Level 1": entityValues.buEntity1,
        "Entity Level 2": entityValues.buEntity2,
        "Entity Level 3": entityValues.buEntity3,
      });

      addSection("Dealer Details", {
        "Internal Dealer": dealerInfo.internalDealer,
        "Counterparty Dealer": dealerInfo.counterpartyDealer,
      });

      addSection("Order Details", {
        "Order Type": orderDetails.orderType,
        "Transaction Type": orderDetails.transactionType,
        Counterparty: orderDetails.counterparty,
        "Local Currency": orderDetails.localCurrency,
      });

      addSection("Financial Details", {
        "Currency Pair": financialData.currencyPair,
        "Booking Amount": financialData.inputValue,
        "Value Type": financialData.valueType,
        "Base Currency": financialData.baseCurrency,
        "Quote Currency": financialData.quoteCurrency,
        "Spot Rate": financialData.spotRate,
        "Forward Points": financialData.forwardPoints,
        "Bank Margin": financialData.bankMargin,
        "Total Rate": financialData.totalRate,
        "Value Quote Currency": financialData.valueQuoteCurrency,
        "Value Local Currency": financialData.valueLocalCurrency,
      });

      addSection("Delivery & Date Details", {
        "Mode of Delivery": deliveryDetails.modeOfDelivery,
        "Delivery Period": deliveryDetails.deliveryPeriod,
        "Add Date": deliveryDetails.addDate,
        "Settlement Date": deliveryDetails.settlementDate,
        "Maturity Date": deliveryDetails.maturityDate,
        "Delivery Date": deliveryDetails.deliveryDate,
      });

      addSection("Additional Details", {
        Remarks: additionalDetails.remarks,
        Narration: additionalDetails.narration,
        Timestamp: additionalDetails.timestamp,
      });

      // Check if any content was added (if yPosition is still at initial value, no content was added)
      if (yPosition <= 40) {
        pdf.setFontSize(12);
        pdf.setTextColor(128, 128, 128);
        pdf.text("No data available to display", pageWidth / 2, 60, {
          align: "center",
        });
      }

      // Add footer with page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);

        // Footer line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        // Page number
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, {
          align: "center",
        });

        // Generated by
        pdf.text("Generated by FX Booking System", 15, pageHeight - 8);
      }

      // Generate filename
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const refId = transactionInfo.internalReferenceId || "DRAFT";
      const filename = `FX_Booking_Form_${refId}_${timestamp}`;

      // Save PDF
      pdf.save(`${filename}.pdf`);
      notify("PDF generated successfully!", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      notify("Error generating PDF. Please try again.", "error");
    }
  };

  // Add this function to test API connectivity


  return (
    <React.Fragment>
      <div className="mb-6 pt-4">
        <div className="transition-opacity duration-300">
          <div className="min-h-screen w-full">
            {/* Error and Success Messages */}

            <div className="flex items-center relative top-2 justify-end gap-2">
              <div className="w-15rem">
                <Button onClick={handleSubmitBooking} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Booking"}
                </Button>
              </div>
              <div className="w-15rem">
                <Button color="Fade" onClick={handlePrintForm}>Print Form</Button>
              </div>
              {/* <div className="w-15rem">
                <Button color="Disable">Save Draft</Button>
              </div> */}
              <div className="w-15rem">
                <Button color="Fade" onClick={handleResetForm}>Reset Form</Button>
              </div>
            </div>

            <div
              ref={formRef}
              id="pdf-section"
              className="grid lg:grid-cols-2 w-full gap-4 rounded-lg"
            >
              <div>
                <TransactionDetails
                  // systemTransactionId={transactionInfo.systemTransactionId}
                  internalReferenceId={transactionInfo.internalReferenceId}
                  onInternalRefChange={handleInternalRefChange}
                />
              </div>
              <div>
                <EntityDetails
                  entityState={entityValues}
                  setEntityState={setEntityValues}
                />
              </div>
              <div>
                <DealerDetails
                  dealerInfo={dealerInfo}
                  setDealerInfo={setDealerInfo}
                />
              </div>
              <div>
                <OrderDetails
                  orderDetails={orderDetails}
                  setOrderDetails={setOrderDetails}
                />
              </div>
              <div>
                <FinancialDetails
                  formData={financialData}
                  setFormData={setFinancialData}
                  currencyPairs={currencyPairs}
                  isLoading={false}
                  orderType={orderDetails.orderType}
                />
              </div>
              <div>
                <DeliveryDateDetails
                  details={deliveryDetails}
                  setDetails={setDeliveryDetails}
                  isLoading={false}
                />
              </div>
              <div>
                <AdditionalDetails
                  details={additionalDetails}
                  setDetails={setAdditionalDetails}
                  isLoading={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default FxForwardBookingForm;