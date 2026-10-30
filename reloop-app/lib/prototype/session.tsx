"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  emptyAdmin,
  type InspectionNote,
} from "@/lib/prototype/model";
import { createClient } from "@/lib/supabase/client";
import { loadProfile } from "@/lib/supabase/records";
import type { DemoProfile, PickupRecord, RewardEvent, Role } from "@/lib/types";
import type { PrototypeState } from "@/lib/prototype/model";

const STORAGE_KEY = "reloop.prototype.v1";

const guestProfile: DemoProfile = {
  name: "",
  email: "",
  role: "donor",
  city: "",
  pointsMonth: 0,
  pointsLifetime: 0,
  rank: 0,
  personalized: false,
};

const serverSnapshot: PrototypeState = {
  profile: guestProfile,
  drafts: [],
  inspections: {},
  admin: emptyAdmin(),
};

let current: PrototypeState = serverSnapshot;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(next: PrototypeState) {
  current = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PrototypeState;
    if (!parsed?.profile?.email || !parsed.profile.role) return;
    current = {
      profile: guestProfile,
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      inspections: parsed.inspections ?? {},
      admin: { ...emptyAdmin(), ...parsed.admin },
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return current;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function emptySubscribe() {
  return () => {};
}

type SessionContextValue = PrototypeState & {
  ready: boolean;
  signIn: (next: Pick<DemoProfile, "name" | "email" | "role">) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
  addDraft: (pickup: PickupRecord) => void;
  saveInspection: (pickupId: string, note: InspectionNote) => void;
  toggleSuspended: (userId: string) => void;
  setRecyclerStatus: (
    id: string,
    status: "pending" | "verified" | "needs_info",
  ) => void;
  setDonationStatus: (
    id: string,
    status: "pending" | "approved" | "declined",
  ) => void;
  addReward: (event: RewardEvent) => void;
  publishWinners: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function PrototypeSessionProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const supabase = createClient();
    loadProfile(supabase)
      .then((profile) => {
        if (!profile) return;
        emit({ ...current, profile });
      })
      .catch(() => {});
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    const update = (recipe: (snapshot: PrototypeState) => PrototypeState) => {
      emit(recipe(current));
    };

    return {
      ...state,
      ready,
      signIn: (next) =>
        update((snapshot) => ({
          ...snapshot,
          profile: { ...snapshot.profile, ...next, personalized: true },
        })),
      signOut: () => {
        void createClient().auth.signOut();
        update((snapshot) => ({
          ...snapshot,
          profile: guestProfile,
        }));
      },
      setRole: (role) =>
        update((snapshot) => ({
          ...snapshot,
          profile: { ...snapshot.profile, role },
        })),
      addDraft: (pickup) =>
        update((snapshot) => ({
          ...snapshot,
          drafts: [pickup, ...snapshot.drafts.filter((item) => item.id !== pickup.id)],
        })),
      saveInspection: (pickupId, note) =>
        update((snapshot) => ({
          ...snapshot,
          inspections: { ...snapshot.inspections, [pickupId]: note },
        })),
      toggleSuspended: (userId) =>
        update((snapshot) => {
          const ids = snapshot.admin.suspendedUserIds;
          const suspendedUserIds = ids.includes(userId)
            ? ids.filter((id) => id !== userId)
            : [...ids, userId];
          return { ...snapshot, admin: { ...snapshot.admin, suspendedUserIds } };
        }),
      setRecyclerStatus: (id, status) =>
        update((snapshot) => ({
          ...snapshot,
          admin: {
            ...snapshot.admin,
            recyclerStatus: { ...snapshot.admin.recyclerStatus, [id]: status },
          },
        })),
      setDonationStatus: (id, status) =>
        update((snapshot) => ({
          ...snapshot,
          admin: {
            ...snapshot.admin,
            donationStatus: { ...snapshot.admin.donationStatus, [id]: status },
          },
        })),
      addReward: (event) =>
        update((snapshot) => ({
          ...snapshot,
          admin: {
            ...snapshot.admin,
            extraRewards: [event, ...snapshot.admin.extraRewards],
          },
        })),
      publishWinners: () =>
        update((snapshot) => ({
          ...snapshot,
          admin: { ...snapshot.admin, winnersPublished: true },
        })),
    };
  }, [ready, state]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function usePrototype() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("usePrototype must be used inside PrototypeSessionProvider");
  }
  return value;
}
