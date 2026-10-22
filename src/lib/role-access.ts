import { UserAccount } from "@/types/emr";

/**
 * Role policy for the training simulator:
 *  - EVERYONE can switch to any working station (Front Desk, Triage, Doctor, Lab, Radiology,
 *    Pharmacy), so classmates can rotate roles and share the stations between them.
 *  - Only teachers (and visitors in demo preview) can open the Master View, because it shows
 *    every patient at every station.
 */
export function canSwitchRole(_user: UserAccount | null): boolean {
  return true;
}

export function canUseMasterView(user: UserAccount | null): boolean {
  return !user || !!user.isAdmin || user.assignedRole === "director";
}
