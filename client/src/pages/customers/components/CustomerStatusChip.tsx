import { Chip } from "@heroui/react";
import type { CustomerItem } from "../../../utils/customer"; 


export default function CustomerStatusChip({ row }: { row: CustomerItem }) {
const total = row.totalBayar ?? 0;
const paid = row.sudahBayar ?? 0;
if (total > 0 && paid >= total) {
return <Chip color="success" variant="flat">Lunas</Chip>;
}
if ((row.sisaBayar ?? (total - paid)) > 0) {
return <Chip color="warning" variant="flat">Ada Sisa</Chip>;
}
return <Chip color="default" variant="flat">-</Chip>;
}