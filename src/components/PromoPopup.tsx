import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CLINIC } from "@/lib/clinic";
import { submitLead } from "@/lib/leads";
import { fetchActivePopup } from "@/lib/popups";
import logo from "@/assets/logo-avicenna.png";

const SHOW_AFTER_MS = 30_000;
const DISMISSED_KEY_PREFIX = "avicenna-popup-dismissed-";
const PHONE_DISPLAY = "+996 779 909 009";

export function PromoPopup() {
  const [elapsed, setElapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!popup || !phone.trim() || !consent) return;
    setSubmitting(true);
    try {
      await submitLead({ popup_id: popup.id, name: name.trim(), phone: phone.trim(), consent });
      setSent(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  };

  if (!popup) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2">
            <img src={logo} alt="Авиценна" className="h-8 w-auto" />
          </div>
        </DialogHeader>

        {popup.displayUrl && (
          <img
            src={popup.displayUrl}
            alt={popup.title}
            className="h-40 w-full rounded-lg object-cover"
          />
        )}

        <div className="bg-surface-green rounded-2xl p-5">
          <DialogTitle className="text-foreground text-center text-xl font-extrabold leading-tight">
            {popup.title}
          </DialogTitle>
          {popup.body && (
            <p className="text-muted-foreground mt-2 text-center text-sm">{popup.body}</p>
          )}

          {sent ? (
            <p className="text-brand-green mt-5 text-center text-base font-semibold">
              Спасибо! Мы скоро свяжемся с вами.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <Input
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
              <Input
                placeholder="Ваш номер телефона *"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background"
              />
              <label className="flex items-start gap-2 text-xs leading-snug">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  required
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  Я согласен(а) на обработку <span className="underline">персональных данных</span>
                </span>
              </label>
              <Button type="submit" className="w-full" disabled={submitting || !consent}>
                {popup.button_text ?? "Отправить заявку"}
              </Button>
            </form>
          )}

          {popup.note_text && (
            <p className="text-muted-foreground mt-3 text-center text-xs">{popup.note_text}</p>
          )}
        </div>

        <p className="text-muted-foreground text-center text-sm">или</p>

        <div className="bg-surface-green rounded-2xl p-5 text-center">
          <p className="text-foreground font-bold">Записаться по телефону</p>
          <a
            href={`tel:${CLINIC.phones[0]}`}
            className="bg-brand-green mt-3 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white"
          >
            <Phone className="size-4" aria-hidden="true" />
            {PHONE_DISPLAY}
          </a>
          <p className="text-muted-foreground mt-2 text-xs">круглосуточно</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
