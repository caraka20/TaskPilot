"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Boxes, CircleDollarSign, PencilLine, Plus, Trash2 } from "lucide-react";
import { api } from "@attendance/lib/api";
import { currency } from "@attendance/lib/format";
import type { Product, User } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Field, Input, Select } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import { Page, PageHeader } from "@attendance/components/ui/page";
import { useFeedback } from "@attendance/components/ui/feedback-provider";

export function ProductsPage() {
  const { confirm, toast } = useFeedback();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [rateProduct, setRateProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [productResult, userResult] = await Promise.all([
        api<{ products: Product[] }>("/admin/products?includeInactive=true"),
        api<{ users: User[] }>("/admin/users"),
      ]);
      setProducts(productResult.products);
      setUsers(userResult.users);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Produk gagal dimuat.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const creating = editing === "new";
    const productName = String(form.get("name") ?? "Produk");
    try {
      if (editing === "new") {
        await api("/admin/products", { method: "POST", body: JSON.stringify({ name: form.get("name"), unit: form.get("unit"), baseRate: form.get("baseRate") }) });
      } else if (editing) {
        await api(`/admin/products/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name: form.get("name"), unit: form.get("unit"), baseRate: form.get("baseRate"), isActive: form.get("isActive") === "on", reason: form.get("reason") }) });
      }
      setEditing(null);
      setNotice("Data produk berhasil disimpan.");
      toast(creating ? "Produk berhasil ditambahkan" : "Produk berhasil diperbarui", {
        description: productName,
        tone: "success",
      });
      await load();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Produk gagal disimpan.";
      setError(message);
      toast("Produk belum dapat disimpan", { description: message, tone: "error" });
    }
  }

  async function setRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rateProduct) return;
    const form = new FormData(event.currentTarget);
    try {
      await api(`/admin/products/${rateProduct.id}/rates/${form.get("userId")}`, { method: "PUT", body: JSON.stringify({ rate: form.get("rate"), reason: form.get("reason") }) });
      setRateProduct(null);
      setNotice("Tarif khusus pengguna berhasil diterapkan mulai hari ini.");
      toast("Tarif khusus berhasil disimpan", {
        description: rateProduct.name,
        tone: "success",
      });
      await load();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Tarif gagal disimpan.";
      setError(message);
      toast("Tarif belum dapat disimpan", { description: message, tone: "error" });
    }
  }

  async function remove(product: Product) {
    const accepted = await confirm({
      title: "Nonaktifkan produk?",
      description: `${product.name} tidak dapat dipilih untuk borongan baru. Riwayat item, tarif snapshot, dan gaji lama tetap tersimpan.`,
      confirmLabel: "Nonaktifkan produk",
      tone: "danger",
      requireAcknowledgement: true,
    });
    if (!accepted) return;
    try {
      await api(`/admin/products/${product.id}`, { method: "DELETE", body: JSON.stringify({ reason: "Produk dinonaktifkan melalui dashboard" }) });
      setNotice("Produk berhasil dinonaktifkan.");
      toast("Produk dinonaktifkan", { description: product.name, tone: "success" });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Produk gagal dinonaktifkan."); }
  }

  return (
    <Page>
      <PageHeader title="Produk dan tarif borongan" description="Kelola master produk dan tetapkan tarif berbeda untuk setiap pengguna dengan riwayat tarif yang aman." action={<Button onClick={() => setEditing("new")}><Plus size={16} />Tambah produk</Button>} />
      {error ? <Alert>{error}</Alert> : null}{notice ? <Alert tone="success">{notice}</Alert> : null}
      <Card>
        {products.length ? <div className="table-wrap"><table><thead><tr><th>Produk</th><th>Status</th><th>Tarif dasar</th><th>Tarif khusus</th><th>Riwayat item</th><th /></tr></thead><tbody>
          {products.map((product) => <tr key={product.id}><td><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Boxes size={18} /></span><div><p className="font-extrabold text-slate-800">{product.name}</p><p className="mt-1 text-[10px] text-slate-400">Satuan {product.unit}</p></div></div></td><td><Badge tone={product.isActive && !product.deletedAt ? "green" : "red"}>{product.isActive && !product.deletedAt ? "Aktif" : "Nonaktif"}</Badge></td><td className="font-extrabold">{currency.format(Number(product.baseRate))}<span className="font-normal text-slate-400">/{product.unit}</span></td><td>{product._count?.userRates ?? 0} riwayat tarif</td><td>{product._count?.workItems ?? 0} transaksi</td><td><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setRateProduct(product)}><CircleDollarSign size={15} /></Button><Button size="sm" variant="ghost" onClick={() => setEditing(product)}><PencilLine size={15} /></Button>{product.isActive && !product.deletedAt ? <Button size="sm" variant="ghost" onClick={() => void remove(product)}><Trash2 className="text-rose-600" size={15} /></Button> : null}</div></td></tr>)}
        </tbody></table></div> : <EmptyState title="Belum ada produk" description="Tambahkan produk agar pengguna dapat mencatat hasil borongan." />}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Tambah produk" : "Edit produk"}>
        {editing ? <form className="space-y-4" onSubmit={saveProduct}><Field label="Nama produk"><Input defaultValue={editing === "new" ? "" : editing.name} name="name" required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Satuan"><Input defaultValue={editing === "new" ? "pcs" : editing.unit} name="unit" required /></Field><Field label="Tarif dasar"><Input defaultValue={editing === "new" ? "0" : editing.baseRate} min="0" name="baseRate" required type="number" /></Field></div>{editing !== "new" ? <><label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-xs font-bold"><input defaultChecked={editing.isActive && !editing.deletedAt} name="isActive" type="checkbox" />Produk aktif</label><Field label="Alasan perubahan"><Input name="reason" minLength={3} required /></Field></> : null}<div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button><Button type="submit">Simpan</Button></div></form> : null}
      </Modal>

      <Modal open={rateProduct !== null} onClose={() => setRateProduct(null)} title="Tetapkan tarif khusus" description={rateProduct ? `${rateProduct.name} — tarif berlaku mulai hari ini dan tidak mengubah transaksi lama.` : undefined}>
        <form className="space-y-4" onSubmit={setRate}><Field label="Pengguna"><Select defaultValue="" name="userId" required><option disabled value="">Pilih pengguna</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.username})</option>)}</Select></Field><Field label={`Tarif per ${rateProduct?.unit ?? "item"}`}><Input min="0" name="rate" required type="number" /></Field><Field label="Alasan"><Input defaultValue="Penetapan tarif borongan pengguna" minLength={3} name="reason" required /></Field><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setRateProduct(null)}>Batal</Button><Button type="submit"><CircleDollarSign size={15} />Simpan tarif</Button></div></form>
      </Modal>
    </Page>
  );
}
