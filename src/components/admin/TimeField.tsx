"use client";

import { useState } from "react";
import { Select } from "@/components/admin/ui";
import { to12Hour, to24Hour, type Clock12 } from "@/lib/programs/schedule";

const hours = Array.from({ length: 12 }, (_, index) => index + 1);
const minuteSteps = Array.from({ length: 12 }, (_, index) => index * 5);

/**
 * Hour, minute and AM/PM pickers. The browser's own time input follows the device
 * locale and often shows 24-hour time, so the 12-hour choice is made explicit here.
 * Submits "HH:MM" in 24-hour time under `name`, or "" when an optional time is left blank.
 */
export function TimeField({
  id,
  label,
  name,
  defaultValue,
  required = false,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const initial = defaultValue ? to12Hour(defaultValue) : null;
  const [time, setTime] = useState<Clock12 | null>(
    initial ?? (required ? { hour: 10, minute: 0, period: "AM" } : null)
  );
  const minutes =
    time && !minuteSteps.includes(time.minute)
      ? [...minuteSteps, time.minute].sort((left, right) => left - right)
      : minuteSteps;

  function update(change: Partial<Clock12>) {
    setTime((current) => ({ ...(current ?? { hour: 12, minute: 0, period: "PM" }), ...change }));
  }

  return (
    <fieldset>
      <legend id={`${id}-label`} className="block text-sm font-semibold text-primary">
        {label}
      </legend>
      <input type="hidden" name={name} value={time ? to24Hour(time) : ""} />
      <div className="mt-2 grid grid-cols-[1fr_1fr_1fr] gap-2">
        <Select
          id={id}
          aria-label={`${label}: hour`}
          value={time?.hour ?? ""}
          onChange={(event) =>
            event.target.value === ""
              ? setTime(null)
              : update({ hour: Number(event.target.value) })
          }
        >
          {!required && <option value="">--</option>}
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </Select>
        <Select
          aria-label={`${label}: minutes`}
          value={time?.minute ?? ""}
          disabled={!time}
          onChange={(event) => update({ minute: Number(event.target.value) })}
        >
          {!time && <option value="">--</option>}
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </Select>
        <Select
          aria-label={`${label}: AM or PM`}
          value={time?.period ?? ""}
          disabled={!time}
          onChange={(event) => update({ period: event.target.value === "AM" ? "AM" : "PM" })}
        >
          {!time && <option value="">--</option>}
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </Select>
      </div>
    </fieldset>
  );
}
