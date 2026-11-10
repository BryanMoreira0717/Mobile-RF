import { createNavigationContainerRef } from "@react-navigation/native";

// Referência usada por serviços/contextos que precisam navegar sem estar
// dentro de uma tela (ex.: tocar em uma notificação de nova mensagem).
export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function resetToRoute(name) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name }] });
  }
}
