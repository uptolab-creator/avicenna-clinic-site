import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchActivePopup } from "@/lib/popups";

const SHOW_AFTER_MS = 30_000;
const DISMISSED_KEY_PREFIX = "avicenna-popup-dismissed-";

export function PromoPopup() {
  const [elapsed, setElapsed] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: popup } = useQuery({
    queryKey: ["active-popup"],
    queryFn: fetchActivePopup,
    staleTime: 60_000,
  });

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!elapsed || !popup) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY_PREFIX + popup.id);
    if (!dismissed) setOpen(true);
  }, [elapsed, popup]);

  const close = () => {
    if (popup) sessionStorage.setItem(DISMISSED_KEY_PREFIX + popup.id, "1");
    setOpen(false);
  };

  if (!popup) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-md">
        {popup.displayUrl && (
          <img
            src={popup.displayUrl}
            alt={popup.title}
            className="-mx-6 -mt-6 mb-2 h-48 w-[calc(100%+3rem)] rounded-t-lg object-cover sm:h-56"
          />
        )}
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{popup.title}</DialogTitle>
          {popup.body && (
            <DialogDescription className="text-base leading-relaxed">
              {popup.body}
            </DialogDescription>
          )}
        </DialogHeader>
        {popup.button_text && popup.button_url && (
          <DialogFooter>
            <Button asChild className="w-full" onClick={close}>
              <a href={popup.button_url}>{popup.button_text}</a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
