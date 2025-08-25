import { Chip } from "@heroui/react"
import { useWorkStore } from "../../store/work.store"
import { toHMS } from "../../utils/format"

export default function WorkStatusChip() {
  const { status, durasiDetik } = useWorkStore()
  if (status === "AKTIF") {
    return <Chip color="success" variant="flat">AKTIF · {toHMS(durasiDetik)}</Chip>
  }
  if (status === "JEDA") {
    return <Chip color="warning" variant="flat">JEDA</Chip>
  }
  return <Chip color="danger" variant="flat">TIDAK AKTIF</Chip>
}
