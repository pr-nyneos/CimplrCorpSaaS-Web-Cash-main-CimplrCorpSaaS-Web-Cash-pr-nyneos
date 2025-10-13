import React, { useEffect, useState, useCallback } from "react";
import Button from "../../../../components/ui/Button";
import nos from "../../../../utils/nos";
const cURLHOST = import.meta.env.VITE_API_BASE_URL;

import OrderDetails from "../../fxComponents/OrderDetails";
import TransactionDetails from "../../fxComponents/TransactionDetails";
import EntityDetails from "../../fxComponents/EntityDetails"
import DealerDetails from "../../fxComponents/DealerDetails";
import DeliveryDateDetails from "../../fxComponents/DeliveryDateDetails";
import FinancialDetails from "../../fxComponents/FinancialDetails";
import AdditionalDetails from "../../fxComponents/AdditionalDetails";
import FxConfirmationDetail from "../../fxComponents/fxConfirmationDetails";
import {useNotification} from "../../../../app/providers/NotificationProvider/Notification.tsx";

type EntityState = {
  buEntity0: string | null;
  buEntity1: string | null;
  buEntity2: string | null;
  buEntity3: string | null;
};

interface Transaction {
  systemTransactionId: string;
  internalReferenceId: string;
  entityLevel0: string;
  entityLevel1: string;
  entityLevel2: string;
  entityLevel3: string;
  localCurrency: string;
  orderType: string;
  valueBaseCurrency:string;
  transactionType: string;
  counterparty: string;
  modeOfDelivery: string;
  deliveryPeriod: string;
  addDate: string;
  settlementDate: string;
  maturityDate: string;
  deliveryDate: string;
  currencyPair: string;
  baseCurrency: string;
  quoteCurrency: string;
  inputValue: number;
  valueType: string;
  actualValueBaseCurrency: number;
  spotRate: number;
  forwardPoints: number;
  bankMargin: number;
  totalRate: number;
  valueQuoteCurrency: number;
  interveningRateQuoteToLocal: number;
  valueLocalCurrency: number;
  internalDealer: string;
  counterpartyDealer: string;
  remarks: string;
  narration: string;
  transactionTimestamp: Date;
  bankTransactionId: string;
  swiftUniqueId: string;
  bankConfirmationDate: string;
  status: string;
}
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

type ConfirmationDetails = {
  bankTransactionId: string;
  swiftUniqueId: string;
  bankConfirmationDate: string;
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
  bank_transaction_id: string;
  swift_unique_id: string;
  bank_confirmation_date: string;
};

const FxConfirmationForm: React.FC = () => {
  const [transactionInfo, setTransactionInfo] = useState({
    systemTransactionId: "Auto-Generated",
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

  const [confirmationDetails, setConfirmationDetails] =
    useState<ConfirmationDetails>({
      bankTransactionId: "",
      swiftUniqueId: "",
      bankConfirmationDate: "",
    });

  const [financialData, setFinancialData] = useState<FinancialDetailsResponse>({
    currencyPair: "",
    inputValue: 0,
    valueType: "",
    actualValueBaseCurrency: 0,
    spotRate: 0,
    forwardPoints: 0,
    bankMargin: 0,
    valueBaseCurrency: "",
    totalRate: 0,
    valueQuoteCurrency: 0,
    interveningRateQuoteToLocal: 0,
    valueLocalCurrency: 0,
    baseCurrency: "",
    quoteCurrency: "",
  });

  const [currencyPairs, ] = useState<OptionType[]>([]);
  // const [financialLoading, setFinancialLoading] = useState<boolean>(true);

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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await nos.post<any>(
          `${cURLHOST}/fx/forwards/entity-relevant-list`
        );
        const apiData = response.data?.data ?? [];

        const transformedData: Transaction[] = apiData.map((item: any) => ({
          systemTransactionId: item.system_transaction_id,
          internalReferenceId: item.internal_reference_id,
          entityLevel0: item.entity_level_0,
          entityLevel1: item.entity_level_1,
          entityLevel2: item.entity_level_2,
          entityLevel3: item.entity_level_3,
          localCurrency: item.local_currency,
          orderType: item.order_type,
          transactionType: item.transaction_type,
          counterparty: item.counterparty,
          modeOfDelivery: item.mode_of_delivery,
          deliveryPeriod: item.delivery_period,
          addDate: item.add_date,
          settlementDate: formatDateForApi(item.settlement_date),
          maturityDate: formatDateForApi(item.maturity_date),
          deliveryDate: formatDateForApi(item.delivery_date),
          currencyPair: item.currency_pair,
          baseCurrency: item.base_currency,
          quoteCurrency: item.quote_currency,
          inputValue: parseFloat(item.booking_amount),
          valueType: item.value_type,
          actualValueBaseCurrency: parseFloat(item.actual_value_base_currency),
          spotRate: parseFloat(item.spot_rate),
          forwardPoints: parseFloat(item.forward_points),
          bankMargin: parseFloat(item.bank_margin),
          totalRate: parseFloat(item.total_rate),
          valueQuoteCurrency: parseFloat(item.value_quote_currency),
          interveningRateQuoteToLocal: parseFloat(
            item.intervening_rate_quote_to_local
          ),
          valueLocalCurrency: parseFloat(item.value_local_currency),
          internalDealer: item.internal_dealer,
          counterpartyDealer: item.counterparty_dealer,
          remarks: item.remarks,
          narration: item.narration,
          transactionTimestamp: new Date(item.transaction_timestamp),
          bankTransactionId: item.bank_transaction_id || "",
          swiftUniqueId: item.swift_unique_id || "",
          bankConfirmationDate: item.bank_confirmation_date || "",
          status: item.processing_status,
        }));

        setAllTransactions(transformedData);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    };

    fetchData();
  }, []);

  const handleInternalRefChange = useCallback(
    (value: string) => {
      setTransactionInfo((prev) => ({ ...prev, internalReferenceId: value }));

      const selectedTransaction = allTransactions.find(
        (txn) => txn.internalReferenceId === value
      );

      if (selectedTransaction) {
        setEntityValues({
          buEntity0: selectedTransaction.entityLevel0,
          buEntity1: selectedTransaction.entityLevel1,
          buEntity2: selectedTransaction.entityLevel2,
          buEntity3: selectedTransaction.entityLevel3,
        });

        setOrderDetails({
          orderType: selectedTransaction.orderType,
          transactionType: selectedTransaction.transactionType,
          counterparty: selectedTransaction.counterparty,
          localCurrency: selectedTransaction.localCurrency,
        });

        setFinancialData({
          currencyPair: selectedTransaction.currencyPair,
          inputValue: selectedTransaction.inputValue,
          valueType: selectedTransaction.valueType,
          actualValueBaseCurrency: selectedTransaction.actualValueBaseCurrency,
          spotRate: selectedTransaction.spotRate,
          forwardPoints: selectedTransaction.forwardPoints,
          valueBaseCurrency: selectedTransaction.valueBaseCurrency,
          bankMargin: selectedTransaction.bankMargin,
          totalRate: selectedTransaction.totalRate,
          valueQuoteCurrency: selectedTransaction.valueQuoteCurrency,
          interveningRateQuoteToLocal:
            selectedTransaction.interveningRateQuoteToLocal,
          valueLocalCurrency: selectedTransaction.valueLocalCurrency,
          baseCurrency: selectedTransaction.baseCurrency,
          quoteCurrency: selectedTransaction.quoteCurrency,

        });

        setDealerInfo({
          internalDealer: selectedTransaction.internalDealer,
          counterpartyDealer: selectedTransaction.counterpartyDealer,
        });

        setDeliveryDetails({
          modeOfDelivery: selectedTransaction.modeOfDelivery,
          deliveryPeriod: selectedTransaction.deliveryPeriod,
          addDate: formatDateForApi(selectedTransaction.addDate),
          settlementDate: selectedTransaction.settlementDate,
          maturityDate: selectedTransaction.maturityDate,
          deliveryDate: selectedTransaction.deliveryDate,
        });

        setAdditionalDetails({
          remarks: selectedTransaction.remarks || "",
          narration: selectedTransaction.narration || "",
          timestamp: new Date(
            selectedTransaction.transactionTimestamp
          ).toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });

        setConfirmationDetails({
          bankTransactionId: selectedTransaction.bankTransactionId,
          swiftUniqueId: selectedTransaction.swiftUniqueId,
          bankConfirmationDate: selectedTransaction.bankConfirmationDate,
        });
      }
    },
    [allTransactions]
  );

  

  const internalRefOptions = allTransactions.map((t) => t.internalReferenceId);

  // Function to prepare API payload
  const prepareApiPayload = (): ApiPayload => {
    const { base_currency, quote_currency } = extractCurrencies(
      financialData.currencyPair
    );

    return {
      internal_reference_id: transactionInfo.internalReferenceId,
      entity_level_0: entityValues.buEntity0 || "",
      entity_level_1: entityValues.buEntity1 || "",
      entity_level_2: entityValues.buEntity2 || "",
      entity_level_3: entityValues.buEntity3 || "",
      local_currency: orderDetails.localCurrency,
      order_type: orderDetails.orderType,
      transaction_type: orderDetails.transactionType,
      counterparty: orderDetails.counterparty,
      mode_of_delivery: deliveryDetails.modeOfDelivery,
      delivery_period: deliveryDetails.deliveryPeriod,
      add_date: formatDateForApi(deliveryDetails.addDate),
      settlement_date: formatDateForApi(deliveryDetails.settlementDate),
      maturity_date: formatDateForApi(deliveryDetails.maturityDate),
      delivery_date: formatDateForApi(deliveryDetails.deliveryDate),
      currency_pair: financialData.currencyPair,
      base_currency: financialData.baseCurrency || base_currency,
      quote_currency: financialData.quoteCurrency || quote_currency,
      booking_amount: financialData.inputValue || 0,
      value_type: financialData.valueType,
      actual_value_base_currency: financialData.actualValueBaseCurrency || 0,
      spot_rate: financialData.spotRate || 0,
      forward_points: financialData.forwardPoints || 0,
      bank_margin: financialData.bankMargin || 0,
      total_rate: financialData.totalRate || 0,
      value_quote_currency: financialData.valueQuoteCurrency || 0,
      intervening_rate_quote_to_local: financialData.interveningRateQuoteToLocal || 0,
      value_local_currency: financialData.valueLocalCurrency || 0,
      internal_dealer: dealerInfo.internalDealer,
      counterparty_dealer: dealerInfo.counterpartyDealer,
      remarks: additionalDetails.remarks || "",
      narration: additionalDetails.narration || "",
      transaction_timestamp: formatTimestampForApi(additionalDetails.timestamp || ""),
      bank_transaction_id: confirmationDetails.bankTransactionId,
      swift_unique_id: confirmationDetails.swiftUniqueId,
      bank_confirmation_date: formatDateForApi(confirmationDetails.bankConfirmationDate),
    };
  };

  // Function to validate required fields
  const validateForm = (): string | null => {
    if (!transactionInfo.internalReferenceId)
      return "Internal Reference ID is required";
    if (!confirmationDetails.bankTransactionId)
      return "Bank Transaction ID is required";
    if (!confirmationDetails.swiftUniqueId)
      return "SWIFT Unique ID is required";
    if (!confirmationDetails.bankConfirmationDate)
      return "Bank Confirmation Date is required";

    return null;
  };

  // Function to submit the confirmation
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

      // Prepare payload
      const payload = prepareApiPayload();
      console.log("Submitting confirmation payload:", payload);

      const response = await nos.post<any>(
        `${cURLHOST}/fx/forwards/manual-entry`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      notify("Confirmation submitted successfully!", "success");
      console.log("Confirmation submitted successfully:", response.data);

      setSubmitSuccess(true);
      // Optionally reset form or redirect user
    } catch (error) {
      console.error("Error submitting confirmation:", error);

      let errorMessage = "An error occurred while submitting the confirmation";
      if (error && typeof error === 'object' && 'response' in error) {
        errorMessage = (error as any).response?.data?.message || (error as any).message || errorMessage;
      }

      notify(`Error submitting confirmation: ${errorMessage}`, "error");
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

  const handleResetForm = () => {
    setTransactionInfo({
      systemTransactionId: "TXN-12345",
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
      inputValue: 0,
      valueType: "",
      actualValueBaseCurrency: 0,
      spotRate: 0,
      forwardPoints: 0,
      bankMargin: 0,
      totalRate: 0,
      valueBaseCurrency: "",
      valueQuoteCurrency: 0,
      interveningRateQuoteToLocal: 0,
      valueLocalCurrency: 0,
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
    setConfirmationDetails({
      bankTransactionId: "",
      swiftUniqueId: "",
      bankConfirmationDate: "",
    });
    setSubmitError(null);
    setSubmitSuccess(false);
  };
  // console.log("allTransactions", allTransactions);

  return (
    <React.Fragment>
      <div className="mb-6 pt-4">
        <div className="transition-opacity duration-300">
          <div className="min-h-screen space-y-2 w-full">
            {/* Error and Success Messages */}

            <div className="flex relative top-4 items-center justify-end gap-2">
              <div className="w-15rem">
                <Button
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Confirmation"}
                </Button>
              </div>
              <div className="w-15rem">
                <Button color="Fade">Print Form</Button>
              </div>
              {/* <div className="w-15rem">
                <Button color="Fade">Save Draft</Button>
              </div> */}
              <div className="w-15rem">
                <Button color="Fade" onClick={handleResetForm}>Reset Form</Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 w-full gap-4">
              <div>
               
                <TransactionDetails
                  systemTransactionId={transactionInfo.systemTransactionId}
                  internalReferenceId={transactionInfo.internalReferenceId}
                  onInternalRefChange={handleInternalRefChange}
                  useDropdown={true}
                  internalRefOptions={internalRefOptions}
                  isThere={false}
                />
              </div>
              <div>
                <EntityDetails
                  entityState={entityValues}
                  setEntityState={setEntityValues}
                  isThere={true} // or false based on your logic
                />
              </div>
              <div>
                <DealerDetails
                  dealerInfo={dealerInfo}
                  setDealerInfo={setDealerInfo}
                  isThere={true} // or false based on your logic
                />
              </div>
              <div>
                <OrderDetails
                  orderDetails={orderDetails}
                  setOrderDetails={setOrderDetails}
                  isThere={true} // or false based on your logic
                />
              </div>
              <div>
                <FinancialDetails
                  formData={financialData}
                  setFormData={setFinancialData}
                  currencyPairs={currencyPairs}
                  isLoading={true}
                />
              </div>
              <div>
                <DeliveryDateDetails
                  details={deliveryDetails}
                  setDetails={setDeliveryDetails}
                  isLoading={true} // or true when loading
                />
              </div>
              <div>
                <AdditionalDetails
                  details={additionalDetails}
                  setDetails={setAdditionalDetails}
                  isLoading={true}
                />
              </div>

              <FxConfirmationDetail
                details={confirmationDetails}
                setDetails={setConfirmationDetails}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default FxConfirmationForm;
