import { map, Observable, of } from "rxjs";

import {
  BillingAccountProfile,
  BillingAccountProfileStateService,
} from "@bitwarden/common/billing/abstractions";
import { BILLING_DISK, StateProvider, UserKeyDefinition } from "@bitwarden/state";

import { UserId } from "../../../types/guid";

export const BILLING_ACCOUNT_PROFILE_KEY_DEFINITION = new UserKeyDefinition<BillingAccountProfile>(
  BILLING_DISK,
  "accountProfile",
  {
    deserializer: (billingAccountProfile) => billingAccountProfile,
    clearOn: ["logout"],
  },
);

export class DefaultBillingAccountProfileStateService implements BillingAccountProfileStateService {
  constructor(private readonly stateProvider: StateProvider) {}

  hasPremiumFromAnyOrganization$(userId: UserId): Observable<boolean> {
    return this.stateProvider
      .getUser(userId, BILLING_ACCOUNT_PROFILE_KEY_DEFINITION)
      .state$.pipe(map((profile) => !!profile?.hasPremiumFromAnyOrganization));
  }

  // fork-override: always report premium so free accounts have full access
  hasPremiumPersonally$(_userId: UserId): Observable<boolean> {
    return of(true);
  }

  // fork-override: always report premium so free accounts have full access
  hasPremiumFromAnySource$(_userId: UserId): Observable<boolean> {
    return of(true);
  }

  async setHasPremium(
    hasPremiumPersonally: boolean,
    hasPremiumFromAnyOrganization: boolean,
    userId: UserId,
  ): Promise<void> {
    await this.stateProvider.getUser(userId, BILLING_ACCOUNT_PROFILE_KEY_DEFINITION).update(
      (_) => {
        return {
          hasPremiumPersonally: hasPremiumPersonally,
          hasPremiumFromAnyOrganization: hasPremiumFromAnyOrganization,
        };
      },
      {
        shouldUpdate: (state) =>
          state == null ||
          state.hasPremiumFromAnyOrganization !== hasPremiumFromAnyOrganization ||
          state.hasPremiumPersonally !== hasPremiumPersonally,
      },
    );
  }
}
