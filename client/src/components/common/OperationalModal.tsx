import type { ReactNode } from "react";
import { Layers3 } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import {
  getOperationalModalClassNames,
  type OperationalModalSize,
} from "./operational-modal.styles";

type Props = {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  className?: string;
  size?: OperationalModalSize;
};

/**
 * Modal operasional TaskPilot.
 *
 * Form, tabel, detail, tab, dan pengaturan selalu memakai viewport penuh pada
 * ponsel serta hampir seluruh viewport pada desktop. Dialog konfirmasi singkat
 * tetap ditangani oleh feedback/SweetAlert agar tidak ikut membesar.
 */
export default function OperationalModal({
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  footer,
  isDismissable = true,
  hideCloseButton = false,
  className = "",
  size = "wide",
}: Props) {
  const modalClassNames = getOperationalModalClassNames(size);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={onClose}
      isDismissable={isDismissable}
      hideCloseButton={hideCloseButton}
      placement="center"
      scrollBehavior="inside"
      size="full"
      backdrop="blur"
      classNames={{
        ...modalClassNames,
        base: `${modalClassNames.base} ${className}`,
      }}
    >
      <ModalContent className="min-h-0">
        <>
          <ModalHeader className="relative sticky top-0 z-20 shrink-0 overflow-hidden border-b border-slate-200/70 bg-white/94 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] pr-16 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/94 sm:px-7 sm:py-5 sm:pr-20">
            <div className="pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-indigo-100/75 blur-3xl dark:bg-indigo-500/10" />
            <div className="relative flex min-w-0 items-start gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#102a4c] text-sky-200 shadow-[0_10px_28px_-14px_rgba(15,42,76,.9)] ring-1 ring-white/10 dark:bg-indigo-500/15 dark:text-indigo-200">
                <Layers3 className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-black uppercase tracking-[.2em] text-indigo-500 dark:text-indigo-300">
                  ARTECH workspace
                </p>
                <div className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">{title}</div>
                {description ? (
                  <div className="mt-1 max-w-4xl text-sm font-normal leading-6 text-foreground-500">
                    {description}
                  </div>
                ) : null}
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.07),transparent_25rem)] bg-slate-50/80 px-4 py-5 dark:bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.11),transparent_28rem)] dark:bg-slate-950 sm:px-7 sm:py-6">
            {children}
          </ModalBody>
          {footer ? (
            <ModalFooter className="sticky bottom-0 z-20 shrink-0 border-t border-slate-200/70 bg-white/92 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-14px_40px_-32px_rgba(15,23,42,.5)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/92 sm:px-7 sm:py-4">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {footer}
              </div>
            </ModalFooter>
          ) : null}
        </>
      </ModalContent>
    </Modal>
  );
}
