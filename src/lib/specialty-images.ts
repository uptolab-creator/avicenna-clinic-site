import urolog from "@/assets/spec-urolog.png";
import gastro from "@/assets/spec-gastro.png";
import kardio from "@/assets/spec-kardio.png";
import nevro from "@/assets/spec-nevro.png";
import gineko from "@/assets/spec-gineko.png";
import travma from "@/assets/spec-travma.png";
import hirurg from "@/assets/spec-hirurg.jpg";
import endokrin from "@/assets/spec-endokrin.png";
import pediatr from "@/assets/spec-pediatr.png";

/** Иллюстрации направлений клиники по slug. */
const IMAGES: Record<string, string> = {
  urolog,
  gastroenterolog: gastro,
  kardiolog: kardio,
  nevrolog: nevro,
  ginekolog: gineko,
  travmatolog: travma,
  hirurg,
  endokrinolog: endokrin,
  pediatr,
};

const FALLBACKS = [kardio, nevro, gastro, travma];

export function specialtyImage(slug: string, index = 0): string {
  return IMAGES[slug] ?? FALLBACKS[index % FALLBACKS.length] ?? kardio;
}
