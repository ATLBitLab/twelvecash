import { ReactNode } from "react";
import Button from "./Button";
import { CrossIcon } from "@bitcoin-design/bitcoin-icons-react/filled";

interface InteractionModalProps {
  title: string;
  children: ReactNode;
  close: () => void;
}
export default function InteractionModal({
  children,
  close,
  title,
}: InteractionModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto overflow-x-hidden text-purple-800 outline-none focus:outline-none">
        <div className="lg: relative my-6 mx-auto w-full max-w-sm">
          <div className="relative flex w-full flex-col gap-6 rounded-lg border-0 bg-12teal shadow-lg outline-none focus:outline-none p-6">
            <div className="flex justify-center rounded-t">
              <h3 className="text-3xl">{title}</h3>
            </div>
            <div>{children}</div>
            <div className="flex items-center justify-center">
              <Button
                format="outline"
                id="modal-close"
                onClick={close}
              >
                Cancel Order <CrossIcon className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black opacity-20"></div>
    </>
  );
}
