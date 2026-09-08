import SimpleCrudPage from "../components/SimpleCrudPage";

interface Coupon { _id: string; code: string; type: string; value: number; active: boolean; usedCount: number; createdAt: string }

export default function Coupons() {
  return (
    <SimpleCrudPage<Coupon>
      resource="coupons"
      title="Discount Coupons"
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "type", label: "Type", type: "select", options: ["percentage", "fixed"], required: true },
        { name: "value", label: "Value", type: "number", required: true },
        { name: "minOrderAmount", label: "Min order amount", type: "number" },
      ]}
      columns={[
        { header: "Code", render: (c) => c.code },
        { header: "Type", render: (c) => c.type },
        { header: "Value", render: (c) => c.value },
        { header: "Used", render: (c) => c.usedCount },
        { header: "Active", render: (c) => (c.active ? "Yes" : "No") },
      ]}
    />
  );
}
