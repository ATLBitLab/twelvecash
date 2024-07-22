import { ReactNode } from "react";

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
      <div className="fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto overflow-x-hidden text-white outline-none focus:outline-none">
        <div className="lg: relative my-6 mx-auto w-1/3 md:w-1/2 xl:w-1/4">
          <div className="relative flex w-full flex-col rounded-lg border-0 bg-stone-900 shadow-lg outline-none focus:outline-none">
            <div className="flex justify-center rounded-t border-b border-solid border-gray-500 p-5">
              <h3 className="text-3xl font-semibold text-white">{title}</h3>
            </div>
            <div className={"p-8"}>{children}</div>
            <div className="flex items-center justify-end rounded-b border-t border-solid border-slate-200 p-6">
              <button
                id={"modal-close"}
                className="background-transparent mr-1 mb-1 px-6 py-2 text-sm font-bold uppercase text-primary outline-none transition-all duration-150 ease-linear focus:outline-none"
                type="button"
                onClick={close}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black opacity-75"></div>
    </>
  );
}
