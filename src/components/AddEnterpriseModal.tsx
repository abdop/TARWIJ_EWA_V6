import { useState } from "react";

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

interface AddEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (enterpriseInfo: EnterpriseInfo, users: UserInfo[]) => Promise<void>;
}

export default function AddEnterpriseModal({
  isOpen,
  onClose,
  onSubmit,
}: AddEnterpriseModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [users, setUsers] = useState<UserInfo[]>([
    {
      name: "",
      email: "",
      role: "",
      category: "ent_admin",
      hederaAccountId: "",
    },
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

  const handleUserChange = (index: number, field: keyof UserInfo, value: string) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);
  };

  const addUser = () => {
    setUsers([
      ...users,
      {
        name: "",
        email: "",
        role: "",
        category: "decider",
        hederaAccountId: "",
      },
    ]);
  };

  const removeUser = (index: number) => {
    if (users.length > 3) {
      setUsers(users.filter((_, i) => i !== index));
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
    const entAdmins = users.filter((u) => u.category === "ent_admin");
    const deciders = users.filter((u) => u.category === "decider");

    if (entAdmins.length === 0) {
      setError("At least one enterprise admin is required");
      return false;
    }

    if (deciders.length < 2) {
      setError("At least two deciders are required");
      return false;
    }

    for (const user of users) {
      if (!user.name || !user.email || !user.role || !user.hederaAccountId) {
        setError("Please fill in all user fields");
        return false;
      }
      if (!user.hederaAccountId.match(/^0\.0\.\d+$/)) {
        setError(`Invalid Hedera Account ID format for ${user.name}`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(enterpriseInfo, users);
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
      setUsers([
        {
          name: "",
          email: "",
          role: "",
          category: "ent_admin",
          hederaAccountId: "",
        },
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
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create enterprise");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Add New Enterprise</h2>
              <p className="text-sm text-gray-400 mt-1">
                Step {step} of 2: {step === 1 ? "Enterprise Information" : "Users & Roles"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
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

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Add at least one enterprise admin and two deciders. You can add more deciders using the + button.
              </p>

              {users.map((user, index) => (
                <div
                  key={index}
                  className="bg-background-light/10 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white">
                      User {index + 1}
                    </h4>
                    {users.length > 3 && (
                      <button
                        onClick={() => removeUser(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name *</label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => handleUserChange(index, "name", e.target.value)}
                        className="w-full bg-background-dark border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Email *</label>
                      <input
                        type="email"
                        value={user.email}
                        onChange={(e) => handleUserChange(index, "email", e.target.value)}
                        className="w-full bg-background-dark border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Role *</label>
                      <input
                        type="text"
                        value={user.role}
                        onChange={(e) => handleUserChange(index, "role", e.target.value)}
                        className="w-full bg-background-dark border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                        placeholder="e.g., CEO, CFO"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Category *</label>
                      <select
                        value={user.category}
                        onChange={(e) =>
                          handleUserChange(index, "category", e.target.value)
                        }
                        className="w-full bg-background-dark border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="ent_admin">Enterprise Admin</option>
                        <option value="decider">Decider</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        Hedera Account ID *
                      </label>
                      <input
                        type="text"
                        value={user.hederaAccountId}
                        onChange={(e) =>
                          handleUserChange(index, "hederaAccountId", e.target.value)
                        }
                        className="w-full bg-background-dark border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                        placeholder="0.0.123456"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addUser}
                className="w-full border-2 border-dashed border-gray-600 rounded-lg py-3 text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Another User</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex items-center justify-between">
          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
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

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
