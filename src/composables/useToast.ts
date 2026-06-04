import { inject, provide, ref, type Ref } from "vue";

const ToastSymbol = Symbol("devkit-toast");

export interface ToastState {
  message: Ref<string>;
  visible: Ref<boolean>;
  showToast: (message: string) => void;
}

export function provideToast(): ToastState {
  const message = ref("");
  const visible = ref(false);
  let timer = 0;

  function showToast(nextMessage: string) {
    message.value = nextMessage;
    visible.value = true;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      visible.value = false;
    }, 1600);
  }

  provide(ToastSymbol, showToast);

  return {
    message,
    visible,
    showToast
  };
}

export function useToast() {
  return inject<(message: string) => void>(ToastSymbol, () => undefined);
}
