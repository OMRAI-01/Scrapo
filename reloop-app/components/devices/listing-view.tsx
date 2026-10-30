"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DescriptionBox } from "@/components/ui/description-box";
import { Field, TextInput } from "@/components/ui/field";
import { DemoBanner, ErrorState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { categoryLabel, conditionLabel, formatInr, formatNumber, workingLabel } from "@/lib/format";
import { usePrototype } from "@/lib/prototype/session";
import { useDemoResource } from "@/lib/prototype/use-demo-resource";
import type { Category, Condition, PickupRecord, WorkingStatus } from "@/lib/types";
import { estimateDevice } from "@/lib/valuation";

const categories = Object.keys(categoryLabel) as Category[];
const conditions = Object.keys(conditionLabel) as Condition[];
const workingStates = Object.keys(workingLabel) as WorkingStatus[];

type Photo = { name: string; url: string };

export function ListingView({ initialCategory }: { initialCategory?: Category }) {
  const router = useRouter();
  const { ready, addDraft, profile } = usePrototype();
  const demo = useDemoResource("listing");
  const [category, setCategory] = useState<Category | "">(initialCategory ?? "");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [ageYears, setAgeYears] = useState(3);
  const [condition, setCondition] = useState<Condition | "">("");
  const [working, setWorking] = useState<WorkingStatus | "">("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEstimate, setShowEstimate] = useState(false);

  const estimate = useMemo(() => {
    if (!category || !condition || !working) return null;
    return estimateDevice({ category, ageYears, condition, working });
  }, [ageYears, category, condition, working]);

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: Photo[] = [];
    let message = "";
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        message = "Only image files can be previewed.";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        message = "Each photo needs to be under 5 MB. Nothing is uploaded.";
        return;
      }
      next.push({ name: file.name, url: URL.createObjectURL(file) });
    });
    setPhotoError(message);
    setPhotos((current) => [...current, ...next].slice(0, 4));
  }

  function removePhoto(url: string) {
    URL.revokeObjectURL(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
  }

  function fillDescription() {
    const name = [brand.trim(), model.trim()].filter(Boolean).join(" ") || "This device";
    const age = ageYears === 0 ? "less than a year" : `${ageYears} ${ageYears === 1 ? "year" : "years"}`;
    const cond = condition ? conditionLabel[condition].toLowerCase() : "used";
    const work = working ? workingLabel[working].toLowerCase() : "not confirmed yet";
    const kind = category ? categoryLabel[category].toLowerCase() : "device";
    setDescription(
      `${name} is a ${kind}, about ${age} old, in ${cond} condition. It is ${work}. Include the charger if you still have it, mention cracks or missing keys, and say whether personal files are still stored on it. I am listing it so it can be refurbished for a student or recovered for parts.`,
    );
    setErrors((current) => {
      const next = { ...current };
      delete next.description;
      return next;
    });
  }

  const steps = [
    { id: "category-field", label: "Category", done: Boolean(category) },
    { id: "brand", label: "Brand and model", done: brand.trim().length >= 2 && model.trim().length >= 1 },
    { id: "condition-field", label: "Condition", done: Boolean(condition) },
    { id: "working-field", label: "Working status", done: Boolean(working) },
    { id: "description", label: "Description", done: description.trim().length >= 24 },
  ];

  function revealEstimate() {
    const next: Record<string, string> = {};
    if (!category) next.category = "Choose a category.";
    if (brand.trim().length < 2) next.brand = "Add the brand.";
    if (model.trim().length < 1) next.model = "Add the model.";
    if (!condition) next.condition = "Choose a condition.";
    if (!working) next.working = "Say whether it works.";
    if (description.trim().length < 24) next.description = "Describe the device, or use Fill description for a starting point.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      setShowEstimate(false);
      const target =
        first === "category" ? "category-field" : first === "condition" ? "condition-field" : first === "working" ? "working-field" : first;
      document.getElementById(target)?.focus();
      return;
    }
    setShowEstimate(true);
  }

  function requestPickup() {
    if (!estimate || !category || !condition || !working) return;
    const id = `local-${Date.now()}`;
    const pickup: PickupRecord = {
      id,
      deviceId: id,
      deviceName: `${brand.trim()} ${model.trim()}`,
      description: description.trim(),
      category,
      address: "Saved only in this browser",
      city: profile.city,
      collectionDate: null,
      status: "requested",
      recycler: {
        name: "Awaiting assignment",
        contact: "Not assigned",
        phone: "—",
        license: "DEMO",
      },
      source: "session",
      timeline: [
        {
          status: "requested",
          label: "Pickup requested",
          at: new Date().toISOString().slice(0, 10),
          note: "Created in this browser. A recycler has not been assigned.",
        },
        {
          status: "scheduled",
          label: "Collection booked",
          at: null,
          note: "A date appears here once a recycler accepts it.",
        },
        {
          status: "collected",
          label: "Collected",
          at: null,
          note: "Not collected.",
        },
        {
          status: "inspected",
          label: "Inspected",
          at: null,
          note: "Inspection has not started.",
        },
        {
          status: "donated",
          label: "Offered to a student",
          at: null,
          note: estimate.reuse === "student donation" ? "Suggested for donation." : "Suggested for parts recovery.",
        },
      ],
    };
    addDraft(pickup);
    router.push(`/pickups/${id}`);
  }

  if (!ready || demo.phase === "loading") return <PageSkeleton cards={2} />;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-olive">Device listing</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Tell us about the device</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Photos stay in this browser session. The estimate is a formula on the page, not an appraisal.
          </p>
        </div>
        <DemoBanner />

        <Card>
          <h2 className="text-lg font-medium" id="category-field" tabIndex={-1}>Category</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Category">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                className={
                  category === item
                    ? "rounded-2xl bg-lime px-3 py-4 text-left text-sm font-semibold text-ink"
                    : "rounded-2xl border border-line bg-white px-3 py-4 text-left text-sm font-semibold"
                }
                onClick={() => setCategory(item)}
              >
                {categoryLabel[item]}
              </button>
            ))}
          </div>
          {errors.category ? <p className="mt-2 text-sm text-danger" role="alert">{errors.category}</p> : null}
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand" htmlFor="brand" error={errors.brand}>
            <TextInput id="brand" list="brands" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Dell" />
            <datalist id="brands">
              {["Apple", "Dell", "HP", "Lenovo", "Samsung", "Xiaomi", "Sony", "LG"].map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>
          <Field label="Model" htmlFor="model" error={errors.model}>
            <TextInput id="model" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Latitude 5420" />
          </Field>
          <div className="sm:col-span-2">
            <label htmlFor="age" className="mb-2 flex items-center justify-between text-sm font-semibold">
              Device age
              <span className="font-display text-olive">{ageYears === 0 ? "Under a year" : `${ageYears} years`}</span>
            </label>
            <input
              id="age"
              type="range"
              min={0}
              max={12}
              value={ageYears}
              onChange={(event) => setAgeYears(Number(event.target.value))}
              className="w-full accent-olive"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium" id="condition-field" tabIndex={-1}>Condition</h2>
          <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Condition">
            {conditions.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={condition === item}
                className={condition === item ? "rounded-2xl bg-olive px-3 py-3 text-sm font-semibold text-paper" : "rounded-2xl border border-line px-3 py-3 text-sm font-semibold"}
                onClick={() => setCondition(item)}
              >
                {conditionLabel[item]}
              </button>
            ))}
          </div>
          {errors.condition ? <p className="mt-2 text-sm text-danger" role="alert">{errors.condition}</p> : null}
          <h2 className="mt-6 text-lg font-medium" id="working-field" tabIndex={-1}>Working status</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="Working status">
            {workingStates.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={working === item}
                className={working === item ? "rounded-2xl bg-lime px-3 py-3 text-sm font-semibold" : "rounded-2xl border border-line px-3 py-3 text-sm font-semibold"}
                onClick={() => setWorking(item)}
              >
                {workingLabel[item]}
              </button>
            ))}
          </div>
          {errors.working ? <p className="mt-2 text-sm text-danger" role="alert">{errors.working}</p> : null}
        </Card>

        <Card>
          <DescriptionBox
            id="description"
            label="Description"
            hint="Mention power, damage, accessories, and anything a student or recycler should expect. This stays in this browser with the listing."
            placeholder="Powers on, charger included, scratch on the corner, files still on the device…"
            value={description}
            error={errors.description}
            onChange={setDescription}
            onFill={fillDescription}
          />
        </Card>

        <Card>
          <h2 className="text-lg font-medium">Photos</h2>
          <p className="mt-1 text-sm text-muted">Up to four images. They are previewed locally and discarded when you leave.</p>
          <label
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-olive/40 bg-paper px-4 py-10 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(event.dataTransfer.files);
            }}
          >
            <span className="text-sm font-semibold">Choose images or drop them here</span>
            <span className="mt-1 text-xs text-muted">JPG, PNG, or WebP · under 5 MB</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {photoError ? <ErrorState title="That file cannot be previewed" text={photoError} /> : null}
          {photos.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.url} className="overflow-hidden rounded-2xl border border-line">
                  <Image src={photo.url} alt={`${photo.name} preview`} width={320} height={224} unoptimized className="h-28 w-full object-cover" />
                  <button type="button" className="w-full px-2 py-2 text-xs font-semibold" onClick={() => removePhoto(photo.url)}>
                    Remove {photo.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No photo yet. You can still see an estimate.</p>
          )}
        </Card>

        <Button size="lg" onClick={revealEstimate}>
          Show valuation
        </Button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className={showEstimate ? "bg-lime" : ""}>
          <p className="text-sm font-semibold text-olive">Valuation</p>
          <ul className="mt-4 space-y-2">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-sm">
                <span
                  className={step.done ? "grid h-5 w-5 place-items-center rounded-full bg-olive text-[11px] text-paper" : "grid h-5 w-5 place-items-center rounded-full border border-line text-[11px] text-muted"}
                  aria-hidden
                >
                  {step.done ? "✓" : ""}
                </span>
                <button type="button" className="text-left font-semibold" onClick={() => document.getElementById(step.id)?.focus()}>
                  {step.label}
                </button>
              </li>
            ))}
          </ul>
          {showEstimate && estimate ? (
            <>
              <p className="mt-3 font-display text-4xl font-medium text-ink">{formatInr(estimate.value)}</p>
              <p className="mt-1 text-sm text-olive-deep">{formatNumber(estimate.points)} prototype points</p>
              <Pill tone="olive">{estimate.reuse}</Pill>
              <p className="mt-4 text-sm leading-6 text-olive-deep">{description.trim()}</p>
              <ul className="mt-4 space-y-3">
                {estimate.lines.map((line) => (
                  <li key={line.label}>
                    <p className="text-sm font-semibold">{line.label}</p>
                    <p className="text-sm text-olive-deep">{line.detail}</p>
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant="olive" onClick={requestPickup}>
                Request a pickup
              </Button>
              <p className="mt-3 text-xs leading-5 text-olive-deep">
                The request is saved in this browser and opens a tracking page. It is not sent to a recycler.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              Finish the checklist, including a short description. The estimate appears here with the path it suggests.
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}
