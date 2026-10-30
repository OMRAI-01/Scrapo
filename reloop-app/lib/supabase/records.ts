import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActivityItem,
  AdminUser,
  AssistanceRequest,
  Category,
  Condition,
  DemoProfile,
  LeaderboardEntry,
  ListingRecord,
  PickupRecord,
  PickupStatus,
  RecyclerAccount,
  RewardEvent,
  TimelineEvent,
} from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

export type Db = SupabaseClient<Database>;

const statuses: PickupStatus[] = [
  "requested",
  "scheduled",
  "collected",
  "inspected",
  "processing",
  "donated",
  "completed",
];

function asStatus(value: string): PickupStatus {
  return statuses.includes(value as PickupStatus) ? (value as PickupStatus) : "requested";
}

function asCategory(value: string): Category {
  const known: Category[] = ["phone", "laptop", "tablet", "monitor", "appliance", "accessory"];
  return known.includes(value as Category) ? (value as Category) : "accessory";
}

function asCondition(value: string): Condition {
  const known: Condition[] = ["excellent", "good", "fair", "poor"];
  return known.includes(value as Condition) ? (value as Condition) : "good";
}

function asDonation(value: string): ListingRecord["donation"] {
  if (value === "reserved" || value === "donated") return value;
  return "available";
}

export async function loadLeaderboard(supabase: Db, highlightId?: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, full_name, city, points_month")
    .order("points_month", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row, index) => ({
    rank: index + 1,
    name: row.full_name,
    city: row.city ?? "",
    points: row.points_month,
    highlight: highlightId ? row.id === highlightId : false,
  }));
}

export async function loadListings(supabase: Db): Promise<ListingRecord[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, device_id, student_price, donation_status, campus, note");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const ids = rows.map((row) => row.device_id);
  const devices = ids.length
    ? await supabase.from("devices").select("id, brand, model, category, condition").in("id", ids)
    : { data: [] as { id: string; brand: string; model: string; category: string; condition: string }[] };
  const byId = new Map((devices.data ?? []).map((device) => [device.id, device]));
  return rows.map((row) => {
    const device = byId.get(row.device_id);
    const title = device ? `${device.brand} ${device.model}`.trim() : row.note;
    return {
      id: row.id,
      title: title || "Listed device",
      category: asCategory(device?.category ?? "accessory"),
      condition: asCondition(device?.condition ?? "good"),
      studentPrice: row.student_price,
      donation: asDonation(row.donation_status),
      campus: row.campus,
      note: row.note,
    };
  });
}

export async function loadAssistance(supabase: Db): Promise<AssistanceRequest[]> {
  const { data, error } = await supabase
    .from("assistance_requests")
    .select("id, student_id, category, need, campus, status");
  if (error) {
    if (/permission|jwt/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    student: "Student",
    campus: row.campus,
    need: row.need,
    category: asCategory(row.category),
    status: row.status === "matched" || row.status === "fulfilled" ? row.status : "open",
    note: row.need,
  }));
}

export async function loadPickups(supabase: Db): Promise<PickupRecord[]> {
  const { data, error } = await supabase
    .from("pickups")
    .select("id, device_id, recycler_id, address, city, collection_date, status, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    if (/permission|jwt/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  const rows = data ?? [];
  const deviceIds = rows.map((row) => row.device_id);
  const recyclerIds = rows.map((row) => row.recycler_id).filter((id): id is string => Boolean(id));
  const pickupIds = rows.map((row) => row.id);
  const [devices, recyclers, events] = await Promise.all([
    deviceIds.length
      ? supabase.from("devices").select("id, brand, model, category, description").in("id", deviceIds)
      : Promise.resolve({ data: [] as { id: string; brand: string; model: string; category: string; description: string }[] }),
    recyclerIds.length
      ? supabase.from("recycler_profiles").select("id, org_name, license, city").in("id", recyclerIds)
      : Promise.resolve({ data: [] as { id: string; org_name: string; license: string; city: string }[] }),
    pickupIds.length
      ? supabase.from("pickup_events").select("pickup_id, status, note, happened_at").in("pickup_id", pickupIds)
      : Promise.resolve({ data: [] as { pickup_id: string; status: string; note: string; happened_at: string }[] }),
  ]);
  const deviceById = new Map((devices.data ?? []).map((device) => [device.id, device]));
  const recyclerById = new Map((recyclers.data ?? []).map((recycler) => [recycler.id, recycler]));
  const eventsByPickup = new Map<string, TimelineEvent[]>();
  for (const event of events.data ?? []) {
    const list = eventsByPickup.get(event.pickup_id) ?? [];
    list.push({
      status: asStatus(event.status),
      label: event.status,
      at: event.happened_at,
      note: event.note,
    });
    eventsByPickup.set(event.pickup_id, list);
  }

  return rows.map((row) => {
    const device = deviceById.get(row.device_id);
    const recycler = row.recycler_id ? recyclerById.get(row.recycler_id) : undefined;
    const status = asStatus(row.status);
    return {
      id: row.id,
      deviceId: row.device_id,
      deviceName: device ? `${device.brand} ${device.model}`.trim() : "Device",
      description: device?.description ?? "",
      category: asCategory(device?.category ?? "accessory"),
      address: row.address,
      city: row.city,
      collectionDate: row.collection_date,
      status,
      recycler: {
        name: recycler?.org_name ?? "Awaiting assignment",
        contact: recycler?.org_name ?? "Not assigned",
        phone: "—",
        license: recycler?.license ?? "—",
      },
      timeline: eventsByPickup.get(row.id) ?? [
        { status, label: status, at: row.created_at, note: "" },
      ],
      source: "session",
    };
  });
}

export async function loadDashboard(supabase: Db) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { donatedCount: 0, estimatedValue: 0, activity: [] as (ActivityItem & { href?: string; certificate?: boolean })[] };
  }
  const [devices, pickups, rewards] = await Promise.all([
    supabase.from("devices").select("id, status, estimated_value, brand, model").eq("owner_id", auth.user.id),
    supabase.from("pickups").select("id, status, city, created_at, device_id").order("created_at", { ascending: false }),
    supabase.from("reward_events").select("id, label, points, created_at").eq("profile_id", auth.user.id).order("created_at", { ascending: false }),
  ]);
  if (devices.error) throw new Error(devices.error.message);
  if (pickups.error) throw new Error(pickups.error.message);
  if (rewards.error) throw new Error(rewards.error.message);
  const donated = (devices.data ?? []).filter((device) => device.status === "donated" || device.status === "completed");
  const names = new Map((devices.data ?? []).map((device) => [device.id, `${device.brand} ${device.model}`.trim()]));
  const activity: (ActivityItem & { href?: string; certificate?: boolean })[] = [
    ...(pickups.data ?? []).map((pickup) => ({
      id: pickup.id,
      kind: "pickup" as const,
      title: names.get(pickup.device_id) || "Pickup",
      detail: `${pickup.status} · ${pickup.city}`,
      at: pickup.created_at,
      href: `/pickups/${pickup.id}`,
      certificate: pickup.status === "donated" || pickup.status === "completed",
    })),
    ...(rewards.data ?? []).map((reward) => ({
      id: reward.id,
      kind: "reward" as const,
      title: reward.label,
      detail: `${reward.points} points`,
      at: reward.created_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    donatedCount: donated.length,
    estimatedValue: donated.reduce((sum, device) => sum + (device.estimated_value ?? 0), 0),
    activity,
  };
}

export async function loadRewards(supabase: Db) {
  const { data: auth } = await supabase.auth.getUser();
  const board = await loadLeaderboard(supabase, auth.user?.id);
  const events = auth.user
    ? await supabase.from("reward_events").select("id, label, points, created_at").eq("profile_id", auth.user.id).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (events.error) throw new Error(events.error.message);
  const history: RewardEvent[] = (events.data ?? []).map((event) => ({
    id: event.id,
    label: event.label,
    points: event.points,
    at: event.created_at,
    source: "session",
  }));
  const { data: winners, error } = await supabase
    .from("monthly_winners")
    .select("rank, points, profile_id")
    .eq("published", true)
    .order("rank", { ascending: true });
  if (error && !/permission|jwt/i.test(error.message)) throw new Error(error.message);
  return { board, history, winners: winners ?? [] };
}

export async function loadProfile(supabase: Db): Promise<DemoProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role, city, points_month, points_lifetime")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const board = await loadLeaderboard(supabase, auth.user.id).catch(() => []);
  const rank = board.find((entry) => entry.highlight)?.rank ?? 0;
  return {
    name: data.full_name,
    email: auth.user.email ?? "",
    role: data.role,
    city: data.city ?? "",
    pointsMonth: data.points_month,
    pointsLifetime: data.points_lifetime,
    rank,
    personalized: true,
  };
}

export async function loadAdmin(supabase: Db) {
  const [users, recyclers, listings, board, pickups, rewards, assistance] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, city, points_lifetime"),
    supabase.from("recycler_profiles").select("id, org_name, city, license, status"),
    supabase.from("listings").select("id, note, campus, donation_status"),
    loadLeaderboard(supabase),
    supabase.from("pickups").select("city"),
    supabase.from("reward_events").select("points"),
    supabase.from("assistance_requests").select("status"),
  ]);
  const failed = [users.error, recyclers.error, listings.error, pickups.error, rewards.error, assistance.error].find(Boolean);
  if (failed) throw new Error(failed.message);
  const byCity = new Map<string, number>();
  for (const row of pickups.data ?? []) {
    const city = row.city || "Unknown";
    byCity.set(city, (byCity.get(city) ?? 0) + 1);
  }
  return {
    users: (users.data ?? []).map((user): AdminUser => ({
      id: user.id,
      name: user.full_name,
      email: "",
      role: user.role,
      city: user.city ?? "",
      points: user.points_lifetime,
    })),
    recyclers: (recyclers.data ?? []).map((recycler): RecyclerAccount => ({
      id: recycler.id,
      name: recycler.org_name,
      city: recycler.city,
      license: recycler.license,
      status: recycler.status === "verified" || recycler.status === "needs_info" ? recycler.status : "pending",
    })),
    donations: (listings.data ?? []).map((listing) => ({
      id: listing.id,
      device: listing.note || "Listing",
      student: "Not matched",
      campus: listing.campus,
      status: listing.donation_status,
    })),
    board,
    impact: {
      devices: (pickups.data ?? []).length,
      students: (assistance.data ?? []).filter((row) => row.status === "fulfilled" || row.status === "matched").length,
      points: (rewards.data ?? []).reduce((sum, row) => sum + row.points, 0),
      byCity: [...byCity.entries()].map(([city, devices]) => ({ city, devices })),
    },
  };
}

export async function createDevicePickup(
  supabase: Db,
  input: {
    category: Category;
    brand: string;
    model: string;
    description: string;
    ageYears: number;
    condition: Condition;
    working: string;
    city: string;
  },
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in before requesting a pickup.");
  const { data: device, error } = await supabase
    .from("devices")
    .insert({
      owner_id: auth.user.id,
      category: input.category,
      brand: input.brand,
      model: input.model,
      description: input.description,
      age_years: input.ageYears,
      condition: input.condition,
      working_status: input.working,
      status: "requested",
    })
    .select("id")
    .single();
  if (error || !device) throw new Error(error?.message ?? "The device was not saved.");
  const { data: pickup, error: pickupError } = await supabase
    .from("pickups")
    .insert({
      device_id: device.id,
      address: "Address to be confirmed with the donor",
      city: input.city || "Not set",
      status: "requested",
      recycler_id: null,
    })
    .select("id")
    .single();
  if (pickupError || !pickup) throw new Error(pickupError?.message ?? "The pickup was not saved.");
  return pickup.id;
}

export async function createAssistance(
  supabase: Db,
  input: { need: string; campus: string; category: Category },
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in before sending a request.");
  const { error } = await supabase.from("assistance_requests").insert({
    student_id: auth.user.id,
    category: input.category,
    need: input.need,
    campus: input.campus || "Not set",
    status: "open",
  });
  if (error) throw new Error(error.message);
}

export async function saveInspectionEvent(supabase: Db, pickupId: string, note: string) {
  const { error } = await supabase.from("pickup_events").insert({
    pickup_id: pickupId,
    status: "inspected",
    note,
    happened_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function updateRecyclerStatus(supabase: Db, id: string, status: RecyclerAccount["status"]) {
  const { error } = await supabase.from("recycler_profiles").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateListingStatus(supabase: Db, id: string, status: "available" | "donated") {
  const { data: listing, error: readError } = await supabase.from("listings").select("device_id").eq("id", id).single();
  if (readError) throw new Error(readError.message);
  const { error } = await supabase.from("listings").update({ donation_status: status }).eq("id", id);
  if (error) throw new Error(error.message);
  if (status !== "donated" || !listing) return;
  const deviceUpdate = await supabase.from("devices").update({ status: "donated" }).eq("id", listing.device_id);
  if (deviceUpdate.error) throw new Error(deviceUpdate.error.message);
  const pickupUpdate = await supabase.from("pickups").update({ status: "donated" }).eq("device_id", listing.device_id);
  if (pickupUpdate.error) throw new Error(pickupUpdate.error.message);
}
