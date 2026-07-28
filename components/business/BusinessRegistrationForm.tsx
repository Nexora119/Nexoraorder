"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  ownerId: string;
}

// No Server Action / service-role client needed here: businesses_insert_own
// (01_schema.sql) already permits an authenticated business_owner to insert
// a row with owner_id = auth.uid(), so a direct browser-client insert is
// architecturally correct — same pattern already used by login/signup.
export function BusinessRegistrationForm({ ownerId }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [operatingHours, setOperatingHours] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase.from("businesses").insert({
        owner_id: ownerId,
        name,
        category,
        description: description || null,
        street_address: streetAddress,
        suburb,
        city,
        province,
        postal_code: postalCode || null,
        email,
        phone,
        operating_hours: operatingHours ? { notes: operatingHours } : null,
      });

      if (insertError) {
        // 23505 = Postgres unique_violation. businesses.email and
        // businesses.phone both have UNIQUE constraints (01_schema.sql) —
        // relying on the database to catch this rather than a separate
        // pre-check query, which would have its own race-condition window.
        if (insertError.code === "23505") {
          if (insertError.message.includes("email")) {
            setError("A business is already registered with this email.");
          } else if (insertError.message.includes("phone")) {
            setError("A business is already registered with this phone number.");
          } else {
            setError("A business with these details is already registered.");
          }
        } else {
          setError(insertError.message);
        }
        return;
      }

      // Dashboard now exists (Milestone 3) and shows this same "pending
      // review" status persistently — redirect there instead of a static
      // one-time message with no way back to it.
      window.location.href = "/business/dashboard";
      return;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-small font-medium mb-1">
            Business name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border px-4 py-3 text-body
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="e.g. Thabo's Kota Corner"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-small font-medium mb-1">
            Category
          </label>
          <input
            id="category"
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-border px-4 py-3 text-body
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="e.g. Kota spot, Fast food, Bakery"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-small font-medium mb-1">
            Description <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border px-4 py-3 text-body
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="A short description customers will see on your page"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="streetAddress" className="block text-small font-medium mb-1">
              Street address
            </label>
            <input
              id="streetAddress"
              type="text"
              required
              autoComplete="street-address"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="suburb" className="block text-small font-medium mb-1">
              Suburb
            </label>
            <input
              id="suburb"
              type="text"
              required
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-small font-medium mb-1">
              City
            </label>
            <input
              id="city"
              type="text"
              required
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="province" className="block text-small font-medium mb-1">
              Province
            </label>
            <input
              id="province"
              type="text"
              required
              autoComplete="address-level1"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="e.g. Gauteng"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-small font-medium mb-1">
              Postal code <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <input
              id="postalCode"
              type="text"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bizEmail" className="block text-small font-medium mb-1">
            Business email
          </label>
          <input
            id="bizEmail"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border px-4 py-3 text-body
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="bizPhone" className="block text-small font-medium mb-1">
            Business phone
          </label>
          <input
            id="bizPhone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-border px-4 py-3 text-body
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="operatingHours" className="block text-small font-medium mb-1">
            Operating hours <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <textarea
            id="operatingHours"
            value={operatingHours}
            onChange={(e) => setOperatingHours(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border px-4 py-3 text-body
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="e.g. Mon–Fri 8am–6pm, Sat 8am–2pm"
          />
        </div>

        {error && (
          <p className="text-small text-danger" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          aria-busy={loading}
          className="mt-2"
        >
          {loading ? "Submitting..." : "Submit for review"}
        </Button>
      </form>
    </Card>
  );
}
