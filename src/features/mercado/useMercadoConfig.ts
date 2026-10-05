import { SUPERMARKETS as DEFAULT_SUPERMARKETS } from '../../constants';
import { useAppStore } from '../../store/useAppStore';

export type Pagador = 'marcela' | 'jonatan' | 'conjunto';

export function useMercadoConfig() {
  const config = useAppStore((s) => s.data.config);
  const updateConfig = useAppStore((s) => s.updateConfig);
  const names = { marcela: config?.marcelaName || "Persona 1", jonatan: config?.jonatanName || "Persona 2" };
  const paymentMethods = config?.paymentMethods ?? [];
  const supermarkets = config?.supermarkets ?? DEFAULT_SUPERMARKETS;

  const addSupermarket = (name: string) => {
    if (supermarkets.includes(name)) return;
    updateConfig({ ...config, supermarkets: [...supermarkets, name] });
  };

  // Cuentas disponibles para quien paga: si paga "los dos" no se filtra (no hay cuentas dueño=conjunto configuradas)
  const methodsFor = (payer: Pagador) =>
    payer === 'conjunto' ? paymentMethods : paymentMethods.filter((m) => m.owner === payer || m.owner === 'conjunto');

  return { names, paymentMethods, supermarkets, addSupermarket, methodsFor };
}
