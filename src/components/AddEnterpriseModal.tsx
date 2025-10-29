import { useState } from "react";
import EnterpriseCreationSuccessModal from "./EnterpriseCreationSuccessModal";

interface EnterpriseInfo {
  name: string;
  symbol: string;
  address: string;
  contactEmail: string;
  bankAccount: string;
  industry: string;
  tokenName: string;
  tokenSymbol: string;
  settlementDay: number;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
  category: "ent_admin" | "decider";
  hederaAccountId: string;
}

interface CreationResult {
  enterpriseId: string;
  tokenId: string;
  swapContractId: string;
  transactionId: string;
}

interface AddEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (enterpriseInfo: EnterpriseInfo, admin: UserInfo, deciders: UserInfo[]) => Promise<CreationResult>;
}

export default function AddEnterpriseModal({
  isOpen,
  onClose,
  onSubmit,
}: AddEnterpriseModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState("");
  const [creationResult, setCreationResult] = useState<CreationResult | null>(null);

  const [enterpriseInfo, setEnterpriseInfo] = useState<EnterpriseInfo>({
    name: "",
    symbol: "",
    address: "",
    contactEmail: "",
    bankAccount: "",
    industry: "",
    tokenName: "",
    tokenSymbol: "",
    settlementDay: 1,
  });

  const [admin, setAdmin] = useState<UserInfo>({
    name: "",
    email: "",
    role: "",
    category: "ent_admin",
    hederaAccountId: "",
  });

  const [deciders, setDeciders] = useState<UserInfo[]>([
    {
      name: "",
      email: "",
      role: "",
      category: "decider",
      hederaAccountId: "",
    },
    {
      name: "",
      email: "",
      role: "",
      category: "decider",
      hederaAccountId: "",
    },
  ]);

  if (!isOpen) return null;

  const handleEnterpriseChange = (field: keyof EnterpriseInfo, value: string | number) => {
    setEnterpriseInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdminChange = (field: keyof UserInfo, value: string) => {
    setAdmin((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeciderChange = (index: number, field: keyof UserInfo, value: string) => {
    const newDeciders = [...deciders];
    newDeciders[index] = { ...newDeciders[index], [field]: value };
    setDeciders(newDeciders);
  };

  const addDecider = () => {
    setDeciders([
      ...deciders,
      {
        name: "",
        email: "",
        role: "",
        category: "decider",
        hederaAccountId: "",
      },
    ]);
  };

  const removeDecider = (index: number) => {
    if (deciders.length > 2) {
      setDeciders(deciders.filter((_, i) => i !== index));
    }
  };

  const validateStep1 = () => {
    if (
      !enterpriseInfo.name ||
      !enterpriseInfo.symbol ||
      !enterpriseInfo.address ||
      !enterpriseInfo.contactEmail ||
      !enterpriseInfo.industry ||
      !enterpriseInfo.tokenName ||
      !enterpriseInfo.tokenSymbol ||
      !enterpriseInfo.settlementDay
    ) {
      setError("Please fill in all required fields");
      return false;
    }
    if (enterpriseInfo.settlementDay < 1 || enterpriseInfo.settlementDay > 31) {
      setError("Settlement day must be between 1 and 31");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!admin.name || !admin.email || !admin.role || !admin.hederaAccountId) {
      setError("Please fill in all admin fields");
      return false;
    }
    if (!admin.hederaAccountId.match(/^0\.0\.\d+$/)) {
      setError("Invalid Hedera Account ID format for admin");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (deciders.length < 2) {
      setError("At least two deciders are required");
      return false;
    }

    for (const decider of deciders) {
      if (!decider.name || !decider.email || !decider.role || !decider.hederaAccountId) {
        setError("Please fill in all decider fields");
        return false;
      }
      if (!decider.hederaAccountId.match(/^0\.0\.\d+$/)) {
        setError(`Invalid Hedera Account ID format for ${decider.name}`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setError(null);
    setCreationProgress("Initializing enterprise creation...");

    try {
      // Simulate progress updates
      setTimeout(() => setCreationProgress("Creating enterprise token on Hedera..."), 1000);
      setTimeout(() => setCreationProgress("Deploying swap smart contract..."), 3000);
      setTimeout(() => setCreationProgress("Registering users..."), 5000);
      setTimeout(() => setCreationProgress("Finalizing setup..."), 7000);

      const result = await onSubmit(enterpriseInfo, admin, deciders);
      setCreationResult(result);
      setCreationProgress("");
    } catch (err: any) {
      setError(err.message || "Failed to create enterprise");
      setCreationProgress("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    // Reset form
    setStep(1);
    setEnterpriseInfo({
      name: "",
      symbol: "",
      address: "",
      contactEmail: "",
      bankAccount: "",
      industry: "",
      tokenName: "",
      tokenSymbol: "",
      settlementDay: 1,
    });
    setAdmin({
      name: "",
      email: "",
      role: "",
      category: "ent_admin",
      hederaAccountId: "",
    });
    setDeciders([
      {
        name: "",
        email: "",
        role: "",
        category: "decider",
        hederaAccountId: "",
      },
      {
        name: "",
        email: "",
        role: "",
        category: "decider",
        hederaAccountId: "",
      },
    ]);
    setCreationResult(null);
    onClose();
  };

  // Show success modal if creation completed
  if (creationResult) {
    return (
      <EnterpriseCreationSuccessModal
        result={{
          ...creationResult,
          tokenName: enterpriseInfo.tokenName,
          tokenSymbol: enterpriseInfo.tokenSymbol,
        }}
        onClose={handleCloseSuccess}
      />
    );
  }

  // Progress Bar Component
  const ProgressBar = () => {
    const steps = [
      { number: 1, label: "Enterprise Info" },
      { number: 2, label: "Admin" },
      { number: 3, label: "Deciders" },
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step >= s.number
                      ? "bg-primary text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {step > s.number ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.number
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    step >= s.number ? "text-white" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-6">
                  <div
                    className={`h-full transition-colors ${
                      step > s.number ? "bg-primary" : "bg-gray-700"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-700 p-6 bg-background-light/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Add New Enterprise</h2>
              <p className="text-sm text-gray-400 mt-1">
                Create a new enterprise with token and swap contract
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ProgressBar />
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isSubmitting && creationProgress && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="flex-1">
                  <p className="text-blue-400 text-sm font-semibold">{creationProgress}</p>
                  <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enterprise Name *
                  </label>
                  <input
                    type="text"
                    value={enterpriseInfo.name}
                    onChange={(e) => handleEnterpriseChange("name", e.target.value)}
                    className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="e.g., Global Solutions Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={enterpriseInfo.symbol}
                    onChange={(e) => handleEnterpriseChange("symbol", e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="e.g., GLS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={enterpriseInfo.address}
                  onChange={(e) => handleEnterpriseChange("address", e.target.value)}
                  className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="Full business address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={enterpriseInfo.contactEmail}
                    onChange={(e) => handleEnterpriseChange("contactEmail", e.target.value)}
                    className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Account
                  </label>
                  <input
                    type="text"
                    value={enterpriseInfo.bankAccount}
                    onChange={(e) => handleEnterpriseChange("bankAccount", e.target.value)}
                    className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="IBAN or account number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry *
                </label>
                <input
                  type="text"
                  value={enterpriseInfo.industry}
                  onChange={(e) => handleEnterpriseChange("industry", e.target.value)}
                  className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="e.g., Software Development"
                />
              </div>

              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Token Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      value={enterpriseInfo.tokenName}
                      onChange={(e) => handleEnterpriseChange("tokenName", e.target.value)}
                      className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                      placeholder="e.g., Global Solutions Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Symbol *
                    </label>
                    <input
                      type="text"
                      value={enterpriseInfo.tokenSymbol}
                      onChange={(e) => handleEnterpriseChange("tokenSymbol", e.target.value.toUpperCase())}
                      maxLength={5}
                      className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                      placeholder="e.g., GLS"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Settlement Day of Month * (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={enterpriseInfo.settlementDay}
                    onChange={(e) => handleEnterpriseChange("settlementDay", parseInt(e.target.value) || 1)}
                    className="w-full bg-background-light/10 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Day of the month when settlements occur (used in token memo)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Enterprise Admin */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm">
                  <strong>Step 2:</strong> Enter the enterprise administrator who will manage this enterprise.
                </p>
              </div>

              <div className="bg-background-light/10 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Enterprise Administrator</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      value={admin.name}
                      onChange={(e) => handleAdminChange("name", e.target.value)}
                      className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={admin.email}
                      onChange={(e) => handleAdminChange("email", e.target.value)}
                      className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                    <input
                      type="text"
                      value={admin.role}
                      onChange={(e) => handleAdminChange("role", e.target.value)}
                      className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      placeholder="CEO, CFO, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hedera Account ID *</label>
                    <input
                      type="text"
                      value={admin.hederaAccountId}
                      onChange={(e) => handleAdminChange("hederaAccountId", e.target.value)}
                      className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
                      placeholder="0.0.123456"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Deciders */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm">
                  <strong>Step 3:</strong> Add at least two deciders who will approve token minting operations.
                </p>
              </div>

              {deciders.map((decider, index) => (
                <div
                  key={index}
                  className="bg-background-light/10 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white">
                      Decider {index + 1}
                    </h4>
                    {deciders.length > 2 && (
                      <button
                        onClick={() => removeDecider(index)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                      <input
                        type="text"
                        value={decider.name}
                        onChange={(e) => handleDeciderChange(index, "name", e.target.value)}
                        className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                      <input
                        type="email"
                        value={decider.email}
                        onChange={(e) => handleDeciderChange(index, "email", e.target.value)}
                        className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="jane@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                      <input
                        type="text"
                        value={decider.role}
                        onChange={(e) => handleDeciderChange(index, "role", e.target.value)}
                        className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="CFO, COO, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Hedera Account ID *</label>
                      <input
                        type="text"
                        value={decider.hederaAccountId}
                        onChange={(e) => handleDeciderChange(index, "hederaAccountId", e.target.value)}
                        className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
                        placeholder="0.0.789012"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addDecider}
                className="w-full border-2 border-dashed border-gray-600 rounded-lg py-3 text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Another Decider</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex items-center justify-between bg-background-light/5">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Enterprise"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
