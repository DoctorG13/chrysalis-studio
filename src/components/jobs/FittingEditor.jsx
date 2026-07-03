import { useState } from "react";

import Button from "../common/Button";
import TextInput from "../common/TextInput";

const STAGES = [
  "Initial Consultation",
  "First Fitting",
  "Second Fitting",
  "Third Fitting",
  "Final Fitting",
  "Collection",
];

export default function FittingEditor({
  fitting = {},
  onSave,
  onCancel,
}) {
  const [stage, setStage] = useState(
    fitting.stage || STAGES[0]
  );

  const [date, setDate] = useState(
    fitting.date || ""
  );

  const [nextAppointment, setNextAppointment] =
    useState(
      fitting.nextAppointment || ""
    );

  const [completion, setCompletion] =
    useState(
      fitting.completion || 0
    );

  const [payment, setPayment] =
    useState(
      fitting.payment || ""
    );

  const [alterations, setAlterations] =
    useState(
      fitting.alterations || ""
    );

  const [fabricNotes, setFabricNotes] =
    useState(
      fitting.fabricNotes || ""
    );

  const [notes, setNotes] =
    useState(
      fitting.notes || ""
    );

  const [measurements] = useState(
    fitting.measurements || {}
  );

  const [photos] = useState(
    fitting.photos || []
  );

  function handleSave() {
    onSave({
      ...fitting,

      id:
        fitting.id ??
        crypto.randomUUID(),

      stage,
      date,
      nextAppointment,

      completion: Number(
        completion || 0
      ),

      payment: Number(
        payment || 0
      ),

      alterations,
      fabricNotes,
      notes,

      measurements,
      photos,

      updatedAt:
        new Date().toISOString(),
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
          }}
        >
          {fitting.id
            ? "Edit Fitting"
            : "New Fitting"}
        </h2>

        <div
          style={{
            color: "#777",
            marginTop: 6,
          }}
        >
          Record everything that happened during this fitting.
        </div>
      </div>

      <div>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Stage
        </label>

        <select
          value={stage}
          onChange={(e) =>
            setStage(e.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {STAGES.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      <TextInput
        label="Appointment Date"
        value={date}
        onChange={setDate}
      />

      <TextInput
        label="Next Appointment"
        value={nextAppointment}
        onChange={
          setNextAppointment
        }
      />

      <TextInput
        label="Garment Completion (%)"
        value={completion}
        onChange={
          setCompletion
        }
      />

      <TextInput
        label="Payment Taken"
        value={payment}
        onChange={setPayment}
      />

      <TextInput
        label="Alterations Required"
        value={alterations}
        onChange={
          setAlterations
        }
      />

      <TextInput
        label="Fabric Notes"
        value={fabricNotes}
        onChange={
          setFabricNotes
        }
      />

      <TextInput
        label="General Notes"
        value={notes}
        onChange={setNotes}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
        }}
      >
        <SummaryCard
          title="Measurements"
          value={
            Object.keys(
              measurements
            ).length
          }
        />

        <SummaryCard
          title="Photos"
          value={photos.length}
        />

        <SummaryCard
          title="Completion"
          value={`${completion}%`}
        />

        <SummaryCard
          title="Payment"
          value={`$${Number(
            payment || 0
          ).toFixed(2)}`}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          gap: 12,
          marginTop: 10,
        }}
      >
        <Button
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
        >
          Save Fitting
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#F8F9FA",
        border: "1px solid #DDD",
        borderRadius: 10,
        padding: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#777",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 22,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>
    </div>
  );
}