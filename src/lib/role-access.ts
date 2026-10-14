import { UserAccount } from "@/types/emr";

/**
 * Role policy for the simulator:
 *  - Guests (not signed in): can freely switch stations (sandbox / demo mode).
 *  - Instructors (account assigned the "director" role): can switch stations.
 *  - Students (any other signed-in account): locked to the role they registered with.
 */
export function canSwitchRole(user: UserAccount | null): boolean {
  return !user || user.assignedRole === "director";
}
