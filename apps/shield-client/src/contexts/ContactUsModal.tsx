import { createContext, useContext, useState } from "react";

interface IModalContext {
  contactUs: boolean;
}

const ModalContext = createContext<{ isOpen: IModalContext; setModalOpen: (modal: keyof IModalContext, isOpen: boolean) => void } | null>(
  null,
);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("Modal context must be used inside provider!");
  }

  return context;
};

const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setOpen] = useState<IModalContext>({ contactUs: false });

  const setModalOpen = (modal: keyof IModalContext, isOpen: boolean) => setOpen((prev) => ({ ...prev, [modal]: isOpen }));

  return <ModalContext.Provider value={{ isOpen, setModalOpen }}>{children}</ModalContext.Provider>;
};

export { useModalContext };
export default ModalProvider;
