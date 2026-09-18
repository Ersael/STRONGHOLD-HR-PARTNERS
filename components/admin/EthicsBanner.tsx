import { ETHICAL_NOTICE } from "@/lib/constants";

/**
 * Banner discreto pero visible que debe aparecer en el dashboard admin.
 * No se debe omitir (ver instrucciones del producto).
 */
export function EthicsBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
      <span className="font-semibold">Aviso: </span>
      {ETHICAL_NOTICE}
    </div>
  );
}
