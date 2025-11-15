import { Lease, Unit, Payment } from "@prisma/client";

/**
 * 租约激活结果 DTO
 */
export class ActivateLeaseResult {
  lease!: Lease;
  unit!: Unit;
  payments!: Payment[];
}
