"use client";

import React, { useState } from "react";
import { useEMR } from "@/context/EMRContext";
import { Department } from "@/types/emr";
import { UserPlus, X, Check } from "lucide-react";

interface NewPatientModalProps {
  onClose: () => void;
}

export function NewPatientModal({ onClose }: NewPatientModalProps) {
  const { registerPatient } = useEMR();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Female" | "Male" | "Other">("Female");
  const [dateOfBirth, setDateOfBirth] = useState("1995-05-15");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [kinName, setKinName] = useState("");
  const [kinRelation, setKinRelation] = useState("Next of Kin");
  const [kinPhone, setKinPhone] = useState("");
  const [paymentType, setPaymentType] = useState<
    "Out-of-Pocket / Cash" | "NHIS / Health Insurance" | "Corporate HMO"
  >("Out-of-Pocket / Cash");
  const [initialRoute, setInitialRoute] = useState<Department>("TRIAGE");
  const [routingReason, setRoutingReason] = useState(
    "New intake enrolled at Front Desk; routed to Nurse Triage for baseline vitals."
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setSubmitting(true);
    await registerPatient(
      {
        fullName,
        age: Number(age) || 0,
        gender,
        dateOfBirth,
        phoneNumber,
        address,
        nextOfKin: {
          name: kinName,
          relation: kinRelation,
          phone: kinPhone,
        },
        paymentType,
      },
      initialRoute,
      routingReason
    );
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-[1px] p-4">
      <div className="bg-white border border-charcoal max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-cream-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sage" />
              <h3 className="font-serif text-lg font-bold text-charcoal">
                Trinity Point Hospital — Patient Intake
              </h3>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Medical records admission docket and initial department routing
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-muted hover:text-charcoal p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-charcoal font-semibold border-b border-cream-border pb-1">
              1. Patient Demographics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Full Legal Name *
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maryam Olatunji"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
                />
              </div>

              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Age (Years) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 29"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>

              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>

              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Billing Category
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                >
                  <option value="Out-of-Pocket / Cash">Out-of-Pocket / Cash</option>
                  <option value="NHIS / Health Insurance">NHIS / Health Insurance</option>
                  <option value="Corporate HMO">Corporate HMO</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 18 Bishop Oluwole, VI, Lagos"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>

              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0802 345 6789"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>
            </div>
          </div>

          {/* Next of Kin */}
          <div className="space-y-3 pt-2">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-charcoal font-semibold border-b border-cream-border pb-1">
              2. Emergency Contact / Next of Kin
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Name
                </label>
                <input
                  type="text"
                  value={kinName}
                  onChange={(e) => setKinName(e.target.value)}
                  placeholder="Contact Name"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>
              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Relationship
                </label>
                <input
                  type="text"
                  value={kinRelation}
                  onChange={(e) => setKinRelation(e.target.value)}
                  placeholder="e.g. Mother, Spouse, Sister"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>
              <div>
                <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={kinPhone}
                  onChange={(e) => setKinPhone(e.target.value)}
                  placeholder="e.g. 0803 111 2222"
                  className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal"
                />
              </div>
            </div>
          </div>

          {/* Flexible Initial Routing */}
          <div className="space-y-3 pt-2">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-charcoal font-semibold border-b border-cream-border pb-1">
              3. Flexible Initial Routing Destination
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  dept: "TRIAGE" as Department,
                  label: "Triage & Vitals (Standard)",
                  desc: "Send to Nurse Triage queue",
                },
                {
                  dept: "CONSULTATION" as Department,
                  label: "Direct to Doctor (Follow-Up)",
                  desc: "Bypass triage; returning patient",
                },
                {
                  dept: "TREATMENT" as Department,
                  label: "Emergency / Treatment",
                  desc: "Acute urgent medication",
                },
                {
                  dept: "LABORATORY" as Department,
                  label: "Direct to Lab (MLS)",
                  desc: "Routine lab specimen collection",
                },
              ].map((r) => (
                <button
                  key={r.dept}
                  type="button"
                  onClick={() => {
                    setInitialRoute(r.dept);
                    if (r.dept === "CONSULTATION") {
                      setRoutingReason("Patient returning from earlier lab draw; routed straight to Doctor consultation.");
                    } else if (r.dept === "TREATMENT") {
                      setRoutingReason("Patient presenting in acute pain; routed straight to Treatment Room.");
                    } else if (r.dept === "LABORATORY") {
                      setRoutingReason("Patient walking in for routine lab specimen draw.");
                    } else {
                      setRoutingReason("New intake enrolled at Front Desk; routed to Nurse Triage for baseline vitals.");
                    }
                  }}
                  className={`p-2.5 text-left border transition-colors flex flex-col justify-between ${
                    initialRoute === r.dept
                      ? "bg-sage text-cream border-sage font-medium"
                      : "bg-white border-cream-border hover:bg-cream-warm text-charcoal"
                  }`}
                >
                  <span className="font-serif font-bold text-xs">{r.label}</span>
                  <span className="text-[10px] opacity-80 mt-1">{r.desc}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-charcoal-muted mb-1 font-mono text-[10px] uppercase">
                Intake Routing Note
              </label>
              <input
                type="text"
                value={routingReason}
                onChange={(e) => setRoutingReason(e.target.value)}
                className="w-full p-2 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-cream-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-cream-border text-charcoal hover:bg-cream-warm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs bg-charcoal text-cream hover:bg-charcoal/90 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-sage-light" />
              <span>{submitting ? "Enrolling..." : "Enroll & Route Patient"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
